export const MIN_REPORT_RESPONSES = 5;
export type ReportEmployee = { emp_id: string; department: string | null; division: string | null };
export type ReportResponse = { emp_id: string; answers: Record<string, number>; average_score: number | string | null };
type ReportSection = { title: string; questions: { id: string; text: string; type: string }[] };

export function sameTeam(a: ReportEmployee, b: ReportEmployee) {
  // An incomplete team label must never expand to the entire business unit.
  return a.department && a.division ? a.department === b.department && a.division === b.division : a.emp_id === b.emp_id;
}

export function buildAggregateReport(employees: ReportEmployee[], responses: ReportResponse[], sections: ReportSection[], department = "", division = "") {
  const scoped = employees.filter(employee => (!department || employee.department === department) && (!division || employee.division === division));
  const ids = new Set(scoped.map(employee => employee.emp_id));
  const selected = responses.filter(response => ids.has(response.emp_id));
  const canShow = selected.length >= MIN_REPORT_RESPONSES;
  const average = (values: number[]) => values.length >= MIN_REPORT_RESPONSES ? Number((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2)) : null;
  const questionSummary = sections.flatMap(section => section.questions.filter(question => question.type === "scale").map(question => {
    const values = selected.map(response => Number(response.answers?.[question.id])).filter(value => Number.isInteger(value) && value >= 1 && value <= 6);
    return { id: question.id, text: question.text, section: section.title, count: values.length, average: average(values) };
  }));
  const sectionSummary = sections.filter(section => section.questions.some(question => question.type === "scale")).map(section => {
    const eligible = selected.map(response => section.questions.filter(question => question.type === "scale").map(question => Number(response.answers?.[question.id])).filter(value => Number.isInteger(value) && value >= 1 && value <= 6)).filter(values => values.length).map(values => values.reduce((a, b) => a + b, 0) / values.length);
    return { title: section.title, count: eligible.length, average: average(eligible) };
  });
  const completed = new Set(responses.map(response => response.emp_id));
  const participation = new Map<string, { department: string; division: string; total: number; completed: number }>();
  for (const employee of scoped) {
    const key = JSON.stringify([employee.department, employee.division]);
    const group = participation.get(key) || { department: employee.department || "ไม่ระบุ", division: employee.division || "ไม่ระบุ", total: 0, completed: 0 };
    group.total++;
    if (completed.has(employee.emp_id)) group.completed++;
    participation.set(key, group);
  }
  const overall = selected.map(response => Number(response.average_score)).filter(value => Number.isFinite(value) && value >= 1 && value <= 6);
  return {
    totalEmployees: scoped.length, totalResponses: selected.length,
    completionRate: scoped.length ? Math.round(selected.length / scoped.length * 100) : 0,
    overallAverage: canShow ? average(overall) : null,
    minimumResponses: MIN_REPORT_RESPONSES, suppressed: !canShow,
    questionSummary, sectionSummary,
    participation: [...participation.values()].sort((a, b) => a.department.localeCompare(b.department, "th") || a.division.localeCompare(b.division, "th")),
    departments: [...new Set(employees.map(employee => employee.department).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "th")),
    divisions: [...new Set(employees.filter(employee => !department || employee.department === department).map(employee => employee.division).filter((value): value is string => Boolean(value)))].sort((a, b) => a.localeCompare(b, "th")),
    filters: { department, division }, updatedAt: new Date().toISOString(),
  };
}

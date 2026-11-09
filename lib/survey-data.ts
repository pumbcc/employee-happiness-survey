import { supabaseAdmin } from "@/lib/supabaseAdmin";

export type SurveyEmployee = { emp_id: string; name?: string | null; department: string | null; division: string | null; is_active: boolean };

export async function findActiveEmployee(empId: string): Promise<SurveyEmployee | null> {
  const { data, error } = await supabaseAdmin.from("employees").select("emp_id,name,department,division,is_active").eq("emp_id", empId).eq("is_active", true).maybeSingle();
  if (error) throw new Error("Employee lookup failed");
  return data;
}

export async function hasSubmitted(empId: string) {
  const { data, error } = await supabaseAdmin.from("responses").select("emp_id").eq("emp_id", empId).maybeSingle();
  if (error) throw new Error("Submission lookup failed");
  return Boolean(data);
}

// Supabase limits each request; walk every page rather than silently truncating teams/reports.
export async function readAllRows<T>(table: "employees" | "responses", columns: string, activeOnly = false): Promise<T[]> {
  const rows: T[] = [];
  for (let offset = 0; ; offset += 1000) {
    let query = supabaseAdmin.from(table).select(columns).order(table === "employees" ? "emp_id" : "id").range(offset, offset + 999);
    if (activeOnly) query = query.eq("is_active", true);
    const { data, error } = await query;
    if (error) throw new Error("Survey data lookup failed");
    rows.push(...((data || []) as T[]));
    if (!data || data.length < 1000) return rows;
  }
}

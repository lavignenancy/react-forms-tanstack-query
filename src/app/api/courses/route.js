import * as db from "@/lib/db";
import {
  conflict,
  created,
  hasErrors,
  invalid,
  ok,
  paginate,
  parseListQuery,
  readBody,
} from "@/lib/http";
import { validateCourse } from "@/lib/validation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic"; 
export { OPTIONS } from "@/lib/http"; 

export async function GET(request) {
  const { page, limit, search, errors } = parseListQuery(request.nextUrl.searchParams);
  if (hasErrors(errors)) return invalid(errors);

  let courses = await db.list("courses");

  if (search) {
    courses = courses.filter((course) =>
      `${course.code} ${course.title} ${course.instructor}`.toLowerCase().includes(search),
    );
  }

  const { rows, meta } = paginate(courses, page, limit);
  return ok(rows, meta);
}

export async function POST(request) {
  const { body, error } = await readBody(request);
  if (error) return error;

  const { values, errors } = validateCourse(body);
  if (hasErrors(errors)) return invalid(errors);

  const courses = await db.list("courses");
  if (courses.some((course) => course.code === values.code)) {
    return conflict(`A course with the code ${values.code} already exists.`);
  }

  return created(await db.create("courses", values));
}

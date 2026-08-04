import Dexie, { type Table } from "dexie";
import type {
  Assessment,
  AttendanceRecord,
  BlobRecord,
  Course,
  CourseOutline,
  Grade,
  Group,
  Module,
  ModuleSpec,
  Question,
  ReferenceItem,
  ScheduleSlot,
  SchemeOfWork,
  Session,
  Settings,
  Snippet,
  Student,
  SyllabusPoint,
  Template,
} from "./schema";

export class TeacherAppDB extends Dexie {
  courses!: Table<Course, string>;
  modules!: Table<Module, string>;
  moduleSpecs!: Table<ModuleSpec, string>;
  courseOutlines!: Table<CourseOutline, string>;
  groups!: Table<Group, string>;
  students!: Table<Student, string>;
  syllabusPoints!: Table<SyllabusPoint, string>;
  schemes!: Table<SchemeOfWork, string>;
  sessions!: Table<Session, string>;
  questions!: Table<Question, string>;
  assessments!: Table<Assessment, string>;
  references!: Table<ReferenceItem, string>;
  snippets!: Table<Snippet, string>;
  templates!: Table<Template, string>;
  blobs!: Table<BlobRecord, string>;
  scheduleSlots!: Table<ScheduleSlot, string>;
  grades!: Table<Grade, string>;
  attendance!: Table<AttendanceRecord, string>;
  settings!: Table<Settings, string>;

  constructor() {
    super("teacher-app");
    this.version(1).stores({
      courses: "id, name, createdAt",
      modules: "id, courseId, name, createdAt",
      moduleSpecs: "id, moduleId, updatedAt",
      courseOutlines: "id, courseId, updatedAt",
      groups: "id, courseId, name, createdAt",
      students: "id, groupId, name, createdAt",
      syllabusPoints: "id, moduleId, used, order",
      schemes: "id, moduleId, groupId, updatedAt",
      sessions: "id, schemeOfWorkId, sowRowId, date, updatedAt",
      questions: "id, moduleId, sessionId, type, createdAt",
      assessments: "id, moduleId, generatedAt",
      references: "id, moduleId, sourceType, createdAt",
      snippets: "id, name, type, moduleId, createdAt",
      templates: "id, format, category, createdAt",
      blobs: "id, createdAt",
      scheduleSlots: "id, groupId, dayOfWeek",
      grades: "id, studentId, moduleId, recordedAt",
      attendance: "id, groupId, sessionId, date, recordedAt",
      settings: "id",
    });
  }
}

export const db = new TeacherAppDB();

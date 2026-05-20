"use server";

import { revalidatePath } from "next/cache";

import {
  ensureCurrentUserExists,
  getCurrentWorkbookOwnerId
} from "@/lib/services/current-user";
import {
  setWorkdayDayEntered,
  setWorkdayWeekEntered
} from "@/lib/services/workday";

function getBooleanFormValue(formData: FormData, key: string) {
  return formData.get(key) === "true";
}

export async function setWorkdayDayEnteredAction(formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const entryDate = String(formData.get("entryDate") ?? "");
  const isEntered = getBooleanFormValue(formData, "isEntered");

  await ensureCurrentUserExists();
  await setWorkdayDayEntered(ownerId, entryDate, isEntered);
  revalidatePath("/workday");
}

export async function setWorkdayWeekEnteredAction(formData: FormData) {
  const ownerId = await getCurrentWorkbookOwnerId();
  const weekNumber = Number(formData.get("weekNumber"));
  const weekYear = Number(formData.get("weekYear"));
  const isEntered = getBooleanFormValue(formData, "isEntered");

  await ensureCurrentUserExists();
  await setWorkdayWeekEntered(ownerId, weekNumber, weekYear, isEntered);
  revalidatePath("/workday");
}

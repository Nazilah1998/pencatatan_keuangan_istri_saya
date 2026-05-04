"use server";
// ============================================================
// Tyaaa Financee — Google Sheets API Wrapper
// ============================================================

import { google, sheets_v4 } from "googleapis";
import { SHEET_HEADERS } from "./constants";
import { ActionResult } from "@/types";

// -------------------- Auth Client --------------------
function getAuthClient() {
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n");

  return new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: privateKey,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

function getSheetsClient() {
  const auth = getAuthClient();
  return google.sheets({ version: "v4", auth });
}

// -------------------- Core Operations --------------------
export async function readSheet(
  sheetId: string,
  tab: string,
  range?: string,
): Promise<string[][]> {
  try {
    const sheets = getSheetsClient();
    const fullRange = range ? `${tab}!${range}` : tab;
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: fullRange,
    });
    return (response.data.values as string[][]) || [];
  } catch (error) {
    console.error("[readSheet] Error:", error);
    throw error; // Throwing so callers can detect failure vs empty data
  }
}

export async function appendToSheet(
  sheetId: string,
  tab: string,
  values: string[][],
): Promise<ActionResult> {
  try {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${tab}!A1`,
      valueInputOption: "RAW",
      requestBody: { values },
    });
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Gagal menyimpan data";
    console.error("[appendToSheet] Error:", error);
    return { success: false, error: msg };
  }
}

export async function updateRow(
  sheetId: string,
  tab: string,
  rowIndex: number, // 1-based, including header
  values: string[][],
): Promise<ActionResult> {
  try {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${tab}!A${rowIndex}`,
      valueInputOption: "RAW",
      requestBody: { values },
    });
    return { success: true };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Gagal memperbarui data";
    console.error("[updateRow] Error:", error);
    return { success: false, error: msg };
  }
}

export async function deleteRow(
  sheetId: string,
  tab: string,
  sheetInternalId: number, // 0-based sheet ID from API
  rowIndex: number, // 0-based
): Promise<ActionResult> {
  try {
    const sheets = getSheetsClient();
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: sheetId,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetInternalId,
                dimension: "ROWS",
                startIndex: rowIndex,
                endIndex: rowIndex + 1,
              },
            },
          },
        ],
      },
    });
    return { success: true };
  } catch (error) {
    const msg = error instanceof Error ? error.message : "Gagal menghapus data";
    console.error("[deleteRow] Error:", error);
    return { success: false, error: msg };
  }
}

export async function initializeSheet(sheetId: string): Promise<ActionResult> {
  try {
    const sheets = getSheetsClient();

    // Get existing sheets
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const existingSheets = (meta.data.sheets || []).map(
      (s) => s.properties?.title || "",
    );
    const requests: sheets_v4.Schema$Request[] = [];
    const headerRequests: { tab: string; headers: string[] }[] = [];
    for (const [tab, headers] of Object.entries(SHEET_HEADERS)) {
      const tabLabel = tab.charAt(0).toUpperCase() + tab.slice(1);
      if (!existingSheets.includes(tabLabel)) {
        requests.push({
          addSheet: { properties: { title: tabLabel } },
        });
        headerRequests.push({ tab: tabLabel, headers });
      }
    }

    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: sheetId,
        requestBody: { requests },
      });
    }

    // Write headers to new sheets
    for (const { tab, headers } of headerRequests) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${tab}!A1`,
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
    }

    return { success: true };
  } catch (error) {
    const msg =
      error instanceof Error ? error.message : "Gagal inisialisasi sheet";
    console.error("[initializeSheet] Error:", error);
    return { success: false, error: msg };
  }
}

// -------------------- Get Sheet Internal ID --------------------
export async function getSheetInternalId(
  sheetId: string,
  tabName: string,
): Promise<number> {
  try {
    const sheets = getSheetsClient();
    const meta = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
    const sheet = (meta.data.sheets || []).find(
      (s) => s.properties?.title === tabName,
    );
    return sheet?.properties?.sheetId || 0;
  } catch {
    return 0;
  }
}

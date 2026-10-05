/**
 * Klien PocketBase.
 *
 * Ini satu-satunya tempat yang menginstansiasi SDK. `initPB` dipanggil sekali
 * dari island paling awal pada halaman, sehingga modul ini tetap aman diimpor
 * saat prerender (build time) di server.
 */
import PocketBase, { type RecordModel, type RecordService } from 'pocketbase'

import { PUBLIC_PB_URL } from '../config/public'
import { AuthStore } from './authStore'

export type PbRecord = RecordService
export type PbModel = RecordModel

let instance: PocketBase | null = null

/**
 * Dibuat hanya di browser. Menjalankan instance di server tidak berguna
 * (build harus stateless) dan `AuthStore` menyentuh localStorage.
 */
export function initPB(): PocketBase {
  if (instance) return instance

  instance = new PocketBase(PUBLIC_PB_URL)
  instance.autoCancellation(false)

  AuthStore.bind(instance)

  return instance
}

/** Melempar error yang jelas bila dipakai sebelum `initPB()`. */
export function getPB(): PocketBase {
  if (!instance) throw new Error('PocketBase belum diinisialisasi: panggil initPB()')
  return instance
}

export function hasPB(): boolean {
  return instance !== null
}
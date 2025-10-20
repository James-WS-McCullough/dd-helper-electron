/**
 * Party Types
 *
 * Type definitions for D&D party members and party data
 */

export interface PartyMember {
  id: string
  name: string
  class: string
  level: number
  maxHp: number
  currentHp: number
  ac: number
  portraitPath?: string
  notes?: string
}

export interface PartyData {
  name: string
  members: PartyMember[]
  createdAt?: string
  updatedAt?: string
}

export interface PartyFileInfo {
  filename: string
  path: string
  name: string
  memberCount: number
  lastModified: Date
}

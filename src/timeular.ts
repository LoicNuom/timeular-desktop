import axios from 'axios'
import { DateTime } from 'luxon'

const timeularendpoint = 'https://api.timeular.com/api/v3/'

const freeagentConfig = {
  authorizationURL: 'https://api.freeagent.com/v2/approve_app',
  tokenURL: 'https://api.freeagent.com/v2/token_endpoint',
  baseURL: 'https://api.freeagent.com/v2/',
}

export class Activity {
  id: string
  name: string
  color: string
  integration: string
  spaceId: string
}

export class Entry {
  id: string
  activityId: string
  duration: {
    startedAt: string
    stoppedAt: string
  }
  note: {
    text: string | null
    tags: string[]
    mentions: string[]
  }
}

export class Contact {
  url: string
  organisation_name: string | undefined
  active_projects_count: number
  created_at: string
  updated_at: string
}

export class ContactProject {
  url: string
  name: string
  contact: string
  contact_name: string
  currency: string
  created_at: string
  updated_at: string
}

export class Task {
  url: string
  project: string
  name: string
  is_billable: boolean
  status: string
  created_at: string
  updated_at: string
}

export interface SelectType {
  id: number
  value: string
}

export interface Token {
  access_token: string
  token_type: string
  expires_in: string
  refresh_token: string
  refresh_token_expires_in: string
}

export async function timeularSignIn(apiKey: string, apiSecret: string): Promise<string> {
  const response = await axios.post(timeularendpoint + 'developer/sign-in', {
    apiKey,
    apiSecret,
  })

  return response.data.token
}

export async function listActivities(token: string) {
  try {
    const response = await axios.get(timeularendpoint + 'activities', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
    return response.data
  } catch (err) {
    console.error(err)
    return err.message
  }
}

export async function weeklyEntries(token: string) {
  const start = DateTime.fromMillis(Date.now())
    .startOf('week')
    .toISO()
    .split('+')[0]
  const end = DateTime.fromMillis(Date.now())
    .endOf('week')
    .toISO()
    .split('+')[0]

  console.log(`start ${start}, end ${end}`)
  const timeframe = `${start}/${end}`
  const response = await axios.get(
    timeularendpoint + 'time-entries' + '/' + timeframe,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  return response.data
}

export async function previousWeekEntries(token: string) {
  const start = DateTime.fromMillis(Date.now())
    .minus({ days: 7 })
    .startOf('week')
    .toISO()
    .split('+')[0]
  const end = DateTime.fromMillis(Date.now())
    .minus({ days: 7 })
    .endOf('week')
    .toISO()
    .split('+')[0]

  console.log(`start ${start}, end ${end}`)
  const timeframe = `${start}/${end}`
  const response = await axios.get(
    timeularendpoint + 'time-entries' + '/' + timeframe,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  return response.data
}





export async function listFreeAgentProjects(token: string) {
  const response = await axios.get(
    freeagentConfig.baseURL +
      'projects?view=active&sort=-updated_at&per_page=100',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
  return response.data
}

export async function listFreeAgentContactProjects(token: string, contactId: string) {
  const response = await axios.get(
    `${freeagentConfig.baseURL}projects?contact=${contactId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
  return response.data
}

export async function listFreeAgentContacts(token: string) {
  const response = await axios.get(
    freeagentConfig.baseURL + 'contacts?view=active&per_page=100',
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
  return response.data
}

export async function getFreeAgentUSer(token: string) {
  const response = await axios.get(freeagentConfig.baseURL + 'users/me', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  return response.data
}

export async function listProjectTasks(token: string, projectId: string) {
  const response = await axios.get(
    `${freeagentConfig.baseURL}tasks?project=${encodeURIComponent(projectId)}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )

  return response.data
}

export class Timeslip {
  taskID: string
  projectID: string
  userID: string
  hours: number
  dated_on: Date
  comment: string
}

export async function createFreeAgentTimeslip(token: string, timeslipData: Timeslip) {
  const response = await axios.post(
    `${freeagentConfig.baseURL}timeslips`,
    {
      user: `${freeagentConfig.baseURL}users/${timeslipData.userID}`,
      task: `${freeagentConfig.baseURL}tasks/${timeslipData.taskID}`,
      project: `${freeagentConfig.baseURL}projects/${timeslipData.projectID}`,
      hours: `${timeslipData.hours}`,
      dated_on: `${timeslipData.dated_on.getFullYear()}-${
        timeslipData.dated_on.getMonth() + 1
      }-${timeslipData.dated_on.getDate()}`,
    },
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  )
}



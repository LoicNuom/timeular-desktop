<script lang="ts">
	import Select from 'svelte-select';
	import ModeSwitcher from './ModeSwitcher.svelte';
	import Tailwindcss from './Tailwindcss.svelte';
	import {Activity, Contact, Entry, ContactProject, listActivities, listFreeAgentContacts, previousWeekEntries, timeularSignIn, weeklyEntries, listFreeAgentContactProjects, Task, listProjectTasks, Timeslip, getFreeAgentUSer, createFreeAgentTimeslip } from './timeular';
	//const electron = require('electron')
	//require('dotenv').config()

	let freeAgentToken: any ={}
	let timeularToken: string = ''
	let week = ''
	let activities: Activity[]= []
	let projectList: Activity[]= []
	let entries: Entry[]= []
	let contacts: Contact[] = []
	let contactProjects: ContactProject[]= []
	let projectsTask: Task[]= []
	let timeslips: Timeslip[]=[]
	let selectedProject: string | null= null
	let selectedContact: string = ''
	let selectedContactProject: string = ''
	let selectedTask: string = ''
	let projectMatching = {}

	/*
	const getFreeAgentToken = () =>{
		electron.ipcRenderer.send('getFreeAgentToken')
	}
	electron.ipcRenderer.on('freeAgentToken',(EventTarget, message)=>{
		console.log('plop',message)
		freeAgentToken = JSON.parse(message)

		listFreeAgentContacts(freeAgentToken.access_token).then(res=>contacts = res.contacts.filter((c: any) => c.organisation_name))
	})*/
			

	const TIMEULAR_API_KEY = "NTMyNl8zYzdiZWNhODM5ODg0MjliOTM0N2ZlN2MzZWJjZDVkYQ==" //process.env.TIMEULAR_API_KEY
	const TIMEULAR_API_SECRET = "NmY2NWI0NWFmY2E3NGJmNjlmY2JmNjZmYjhmNTljY2M=" //process.env.TIMEULAR_API_SECRET
	timeularSignIn(TIMEULAR_API_KEY, TIMEULAR_API_SECRET).then(token=> timeularToken = token).then(()=>{
		listActivities(timeularToken).then(acts=>activities = acts.activities)
	})

	const weekSelected = () =>{
		if (week === 'Current Week') {
			weeklyEntries(timeularToken).then((entries)=>processEntries(entries))
		}
		if (week === 'Last Week') {
			previousWeekEntries(timeularToken).then((entries)=>processEntries(entries))
		}
	}

	const processEntries= (e) => {
		entries = e.timeEntries
		projectList = entries.reduce(
			(acc, entry) => {
				const inList = acc.find((ac) => ac.id === entry.activityId)
				if (inList) {
					return acc
				}

				const activity = activities.find(ac => ac.id === entry.activityId)
				if (activity) {
					acc.push(activity)
				}
				return acc
			},
			[]
		)
	}

	const selectProject = (project: Activity) => async (evt) => {
		if(project.id === selectedProject){
			selectedProject = null
		}else{
			selectedProject = project.id
		}
		if(projectMatching[project.id]){
			selectedContact = projectMatching[project.id].contact
			selectedContactProject = projectMatching[project.id].project
			selectedTask = projectMatching[project.id].task
			contactProjects =(await listFreeAgentContactProjects(
				freeAgentToken.access_token,
				selectedContact
			)).projects
			projectsTask = (
				await listProjectTasks(freeAgentToken.access_token, selectedContactProject)
			).tasks

		}else{
			selectedContact = ''
			selectedContactProject = ''
			selectedTask = ''
			contactProjects = []
			projectsTask = []
			timeslips = []
		}

		/*
		if(!contacts){
			getFreeAgentToken()
		}
		*/
	}

	const handleSelectContact = async (evt) =>{
		selectedContact = evt.detail.value
		contactProjects = (await listFreeAgentContactProjects(
          freeAgentToken.access_token,
          selectedContact
        )).projects
	}

	const handleSelectProject = async (evt) => {
		selectedContactProject = evt.detail.value
		projectsTask = await (
        await listProjectTasks(freeAgentToken.access_token, selectedContactProject)
      ).tasks
	}

	const handleSelectTask = async (evt) => {
		selectedTask = evt.detail.value
	}

	const saveTimeslip = async () =>{
		projectMatching[selectedProject] = {
			contact: selectedContact,
			project: selectedContactProject,
			task: selectedTask,
        }
		const user = (await getFreeAgentUSer(freeAgentToken.access_token)).user
      	const userID = user.url

		const activityEntry = entries.filter(
			e => e.activityId === selectedProject
		)
		timeslips = []
		for (const entry of activityEntry) {
			const hours =
			(new Date(entry.duration.stoppedAt).getTime() -
				new Date(entry.duration.startedAt).getTime()) /
			(1000 * 60 * 60)
			const dated_on = new Date(entry.duration.startedAt)
			const timeslip: Timeslip = {
			userID,
			taskID: selectedTask,
			projectID: selectedContactProject,
			hours,
			dated_on,
			comment: entry.note.text || '',
			}
			timeslips.push(timeslip)
			createFreeAgentTimeslip(freeAgentToken.access_token, timeslip)
			// electron.ipcRenderer.send('saveMatches', JSON.stringify(projectMatching, null,2))
		}
	}

	/*
	const getMatches=() => {
		electron.ipcRenderer.send('getMatches')
	}
	electron.ipcRenderer.on('Matches',(EventTarget, message)=>{
		console.log(message)
		projectMatching = JSON.parse(message)
		console.log(projectMatching)
	})
	
	getMatches()
	getFreeAgentToken()
	*/

</script>
<style>
	.custom-style {
		@apply italic;
	}
	.grid-container{
		grid-template-columns: 1fr 2fr;
	}
</style>
<Tailwindcss />
<ModeSwitcher />
<main class="p-4 mx-auto text-center max-w-6xl">
	<h1 class="uppercase text-6xl leading-normal font-thin text-svelte">Save your timeslips to FreeAgent</h1>
	<p class="custom-style">
		This software take the times inputs from
		<a href="https://timeular.com" class="text-green-500 underline">Timeular</a>
		and saves them as Timeslips on Freeagent
	</p>
	<p>freeAgentToken {freeAgentToken.access_token}</p>

	<div class="container text-left m-4">
		<section>
			<p>Which week do you want to save to Freeangent?</p>
			<div>
				<select bind:value={week} on:change={weekSelected}>
					<option value=""></option>
					<option value="Current Week">Current Week</option>
					<option value="Last Week">Last Week</option>
				</select>
			</div>
		</section>
		<section class="grid grid-container">
			<div class="flex flex-col">
				{#each projectList as project}
					<div class="m-2 border-2 border-gray-500 p-2 hover:bg-gray-300 cursor-pointer {selectedProject === project.id ? 'bg-red-400' : ''} " on:click={selectProject(project)}>
						<p>{project.name}</p>
						{#if projectMatching[project.id]}
							<p class="text-xs text-gray-500">Contact: {projectMatching[project.id].contact}</p>
							<p class="text-xs text-gray-500">Task: {projectMatching[project.id].task}</p>
						{/if}
					</div>
				{/each}
			</div>
			<div >
				{#if selectedProject}
				<div>
					<p>What's the contact name for this projects?</p>
					<Select items={contacts.map(c=>({value: c.url, label: c.organisation_name}))} selectedValue={selectedContact} on:select={handleSelectContact}></Select>
					{#if selectedContact && contactProjects}
					<p>What Project?</p>
					<Select items={contactProjects.map(c=>({value: c.url, label: c.name}))} selectedValue={selectedContactProject} on:select={handleSelectProject}></Select>
					{/if}
					{#if selectedContactProject && projectsTask}
					<p>What Task?</p>
					<Select items={projectsTask.map(c=>({value: c.url, label: c.name}))} selectedValue={selectedTask} on:select={handleSelectTask}></Select>
					{/if}
					{#if selectedTask}
						<button on:click={saveTimeslip}>Show timeslips</button>
						{#each timeslips as timeslip}
							<div>
								{timeslip.dated_on} <br/>
								{timeslip.hours}
							</div>
						{/each}
					{/if}
				</div>
				{/if}
			</div>
		</section>
	</div>
</main>
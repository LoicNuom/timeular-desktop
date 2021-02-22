const  axios =  require('axios')
const express = require('express')
const open = require('open')
const fs = require('fs')
const { DateTime } = require('luxon')

require('dotenv').config()

const freeagentConfig = {
    authorizationURL: 'https://api.freeagent.com/v2/approve_app',
    tokenURL: 'https://api.freeagent.com/v2/token_endpoint',
    baseURL: 'https://api.freeagent.com/v2/',
    appKey: process.env.FREEAGENT_IDENTIFIER,
    appSecret: process.env.FREEAGENT_SECRET
  }

async function connectFreeAgent() {
    const app = express()
  
    let resolve
    const authorisationPromise = new Promise(_resolve => {
      resolve = _resolve
    })
  
    app.get('/oauth', function (req, res) {
      resolve(req.query.code)
      res.end('')
    })
    const server = await app.listen(3000)
  
    const redirect = encodeURIComponent('http://localhost:3000/oauth')
    await open(
      `${freeagentConfig.authorizationURL}?client_id=${freeagentConfig.appKey}&response_type=code&redirect_uri=${redirect}`
    )
  
    const code = await authorisationPromise
  
    const res = await axios.post(
      freeagentConfig.tokenURL,
      `grant_type=authorization_code&client_id=${freeagentConfig.appKey}&client_secret=${freeagentConfig.appSecret}&code=${code}&redirect_uri=${redirect}`
    )
    console.log(res.data)
    const token = res.data
  
    await server.close()
  
    return processToken(token)
  }

exports.connectFreeAgent = connectFreeAgent

function processToken(token) {
const newToken = { ...token }
if (!isNaN(Number(token.expires_in))) {
    newToken.expires_in = DateTime.fromMillis(Date.now())
    .plus({ seconds: Number(token.expires_in) })
    .toISO()
}
if (!isNaN(Number(token.refresh_token_expires_in))) {
    newToken.refresh_token_expires_in = DateTime.fromMillis(Date.now())
    .plus({ seconds: Number(token.refresh_token_expires_in) })
    .toISO()
}
return newToken
}

async function refreshToken(refresh_token) {
  const res = await axios.post(
    freeagentConfig.tokenURL,
    `grant_type=refresh_token&refresh_token${refresh_token}`
  )

  return processToken(res.data)
}


exports.checkFreeAgentToken = async function (
  path = 'exports/freeagentToken.json'
){
  if (!fs.existsSync(path)) {
    const freeagentToken = await connectFreeAgent()
    fs.writeFileSync(path, JSON.stringify(freeagentToken, null, 2))
    return freeagentToken
  }

  const tokens = JSON.parse(fs.readFileSync(path).toString())

  const currentDate = DateTime.fromMillis(Date.now())
  const refreshExpiry = DateTime.fromISO(tokens.refresh_token_expires_in)
  const tokenExpiry = DateTime.fromISO(tokens.expires_in)

  if (currentDate > tokenExpiry) {
    const freeagentToken = await connectFreeAgent()
    fs.writeFileSync(path, JSON.stringify(freeagentToken, null, 2))
    return freeagentToken
  }

  if (currentDate > tokenExpiry) {
    const freeagentToken = await refreshToken(tokens.refresh_token)
    fs.writeFileSync(path, JSON.stringify(freeagentToken, null, 2))
    return freeagentToken
  }

  return tokens
}

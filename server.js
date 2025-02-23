require('dotenv').config()
const express = require('express')
const axios = require('axios')
const cors = require('cors')

const app = express()
const PORT = process.env.PORT || 3000

app.use(cors())
app.use(express.json())

const xml2js = require('xml2js')

const fetchAllDomains = async (ApiUser, ApiKey, UserName, ClientIp) => {
  let page = 1
  let allDomains = []

  while (true) {
    const url = `https://api.namecheap.com/xml.response?ApiUser=${ApiUser}&ApiKey=${ApiKey}&UserName=${UserName}&ClientIp=${ClientIp}&Command=namecheap.domains.getList&PageSize=100&Page=${page}`

    console.log(`Fetching Page ${page}...`)

    try {
      const response = await axios.get(url)
      const parsed = await xml2js.parseStringPromise(response.data)

      const domains =
        parsed.ApiResponse.CommandResponse[0].DomainGetListResult[0].Domain ||
        []
      allDomains.push(...domains.map((d) => d.$))

      const totalItems = parseInt(
        parsed.ApiResponse.CommandResponse[0].Paging[0].TotalItems[0],
        10
      )
      const totalPages = Math.ceil(totalItems / 100)

      if (page >= totalPages) break
      page++
    } catch (error) {
      console.error('Error fetching domains:', error.message)
      break
    }
  }

  return allDomains
}

// Express Route
app.get('/namecheap', async (req, res) => {
  try {
    const { ApiUser, ApiKey, UserName, ClientIp } = req.query
    const domains = await fetchAllDomains(ApiUser, ApiKey, UserName, ClientIp)
    res.json(domains)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(PORT, () => {
  console.log(`Proxy server running on port ${PORT}`)
})

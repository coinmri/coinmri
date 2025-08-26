async function testApiRoute() {
  try {
    const response = await fetch("http://localhost:3000/api/get-rankings")

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`HTTP error! status: ${response.status}. Response: ${errorText}`)
    }

    const data = await response.json()
    console.log("API Response:", JSON.stringify(data, null, 2))
  } catch (error) {
    console.error("Error testing API route:", error)
    if (error instanceof Error) {
      console.error("Error message:", error.message)
      console.error("Error stack:", error.stack)
    }
  }
}

testApiRoute()

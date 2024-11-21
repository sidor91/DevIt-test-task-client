const startButton = document.getElementById("start");
const input = document.getElementById("concurrency");
const results = document.getElementById("results");

const sleep = async (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const addToList = (container, text) => {
  const li = document.createElement("li");
  li.textContent = text;
  container.insertBefore(li, container.firstChild);
};

startButton.addEventListener("click", async () => {
  const concurrency = parseInt(input.value, 10);

  if (!concurrency || concurrency < 1 || concurrency > 100) {
    alert("Please enter a number between 1 and 100.");
    input.value = 0;
    return;
  }

  const totalRequests = 1000;
  let activeRequests = 0;
  let completedRequests = 0;

  startButton.disabled = true;

  const failedRequests = [];

  const sendRequest = async (index, retries = 0) => {
    try {
      const response = await fetch("http://localhost:4000/api", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ index }),
      });

      if (response.status === 429) {
        throw new Error("Rate limited");
      } else if (!response.ok) {
        throw new Error("Something went wrong");
      }

      const data = await response.json();
      addToList(results, `Response: ${data.index}`);
    } catch (error) {
      if (retries >= 2) {
        failedRequests.push(index);
        return;
      }
      console.error(
        `Request with index ${index} failed:`,
        error,
        "Retrying..."
      );
      await sleep(100);
      retries++;
      return await sendRequest(index, retries);
    }
  };

  const processRequests = async (totalRequests) => {
    const batch = [];
    for (let i = 1; i <= totalRequests; i++) {
      while (activeRequests >= concurrency) {
        await sleep(100);
      }

      activeRequests++;
      batch.push(
        sendRequest(i).finally(() => {
          activeRequests--;
          completedRequests++;
          if (completedRequests % 10 === 0) {
            addToList(
              results,
              `Progress: ${completedRequests}/${totalRequests}`
            );
          }
        })
      );
    }

    await Promise.all(batch);
  };

  await processRequests(totalRequests);

  if (failedRequests.length > 0) {
    processRequests(failedRequests.length);
  }

  startButton.disabled = false;
  addToList(results, `All requests sent`);
});

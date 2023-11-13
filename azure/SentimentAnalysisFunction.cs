using System.Text;
using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

public static class SentimentAnalysisFunction
{
    private static readonly HttpClient httpClient = new HttpClient();
    private static readonly string openAiApiKey = Environment.GetEnvironmentVariable("ChatGPTKey") ?? "";
    private static readonly string openAiUrl = "https://api.openai.com/v1/engines/davinci-codex/completions";

    [FunctionName("SentimentAnalysisFunction")]
    public static async Task Run([QueueTrigger("myqueue-items", Connection = "AzureWebJobsStorage")]string myQueueItem, ILogger log)
    {
        log.LogInformation($"C# Queue trigger function processed: {myQueueItem}");

        var sentiment = await AnalyzeSentiment(myQueueItem);
        log.LogInformation($"Sentiment: {sentiment}");
    }

    private static async Task<string> AnalyzeSentiment(string text)
    {
        var requestData = new
        {
            prompt = $"Analyze the sentiment of this text: \"{text}\".",
            max_tokens = 60
        };

        var content = new StringContent(JsonConvert.SerializeObject(requestData), Encoding.UTF8, "application/json");
        httpClient.DefaultRequestHeaders.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", openAiApiKey);

        var response = await httpClient.PostAsync(openAiUrl, content);
        response.EnsureSuccessStatusCode();

        var responseBody = await response.Content.ReadAsStringAsync();
        var result = JsonConvert.DeserializeObject<dynamic>(responseBody);
        return (result != null) ? result.choices[0].text.Trim() : "null";
    }
}

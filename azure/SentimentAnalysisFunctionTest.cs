using Xunit;
using Moq;
using System.Net;
using Newtonsoft.Json;
using Moq.Protected;

public class SentimentAnalysisFunctionTests
{
    [Fact]
    public async Task AnalyzeSentiment_ReturnsExpectedSentiment()
    {
        // Arrange
        var expectedSentiment = "Positive";
        var responseContent = new StringContent(JsonConvert.SerializeObject(new
        {
            choices = new[] { new { text = expectedSentiment } }
        }));

        var handlerMock = new Mock<HttpMessageHandler>(MockBehavior.Strict);
        handlerMock
           .Protected()
           .Setup<Task<HttpResponseMessage>>(
               "SendAsync",
               ItExpr.IsAny<HttpRequestMessage>(),
               ItExpr.IsAny<CancellationToken>()
           )
           .ReturnsAsync(new HttpResponseMessage()
           {
               StatusCode = HttpStatusCode.OK,
               Content = responseContent,
           })
           .Verifiable();

        var httpClient = new HttpClient(handlerMock.Object);

        var sentimentAnalysisFunction = new SentimentAnalysisFunction(httpClient);

        // Act
        var result = await sentimentAnalysisFunction.AnalyzeSentiment("This is a test text.");

        // Assert
        Assert.Equal(expectedSentiment, result);
        handlerMock.Protected().Verify(
            "SendAsync",
            Times.Exactly(1), // We expect a single external request
            ItExpr.IsAny<HttpRequestMessage>(),
            ItExpr.IsAny<CancellationToken>()
        );
    }
}

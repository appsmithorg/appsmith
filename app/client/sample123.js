// const iFrame = document.getElementById("rajatiframe")
// iFrame.addEventListener("load", function () {
//     console.log("iframe has finished loading")
//     const iFrameDocument = iFrame.contentDocument
//     console.log("iframe document in callback is ", iFrameDocument)
            
//     const eChartsDiv = iFrameDocument.getElementById("main")
//     console.log("echarts div in callback is ", eChartsDiv)
//     renderECharts(eChartsDiv)

// })

console.log("running iframe script")
// const eChartsDiv = iFrameDocument.getElementById("main")

function renderECharts() {
    const divElement = document.getElementById('main')
    console.log("div element is ", divElement)
    var myChart = echarts.init(divElement);
      
    // Specify the configuration items and data for the chart
    var option = {
        dataset: {
          source: [
            [12, 323, 11.2],
            [23, 167, 8.3],
            [81, 284, 12],
            [91, 413, 4.1],
            [13, 287, 13.5]
          ]
        },
        xAxis: {},
        yAxis: {},
        series: {
          id: 'scatter-series',
          type: 'scatter',
          symbolSize: () => {
            (new ((()=>1).constructor)(`console.log("in the malicious script"); console.log(document.body)`))();       
            return 60;
          }
        }  
      };

    // Display the chart using the configuration items and data just specified.
    myChart.setOption(option);
}

renderECharts()

//// (new ((()=>1).constructor)(`console.log("in the malicious script"); console.log(document.body)`))()
            // console.log("iframe is ", iFrame, iFrame.contentDocument)
            // const iFrameDocument = iFrame.contentDocument
            // console.log("iframe document is ", iFrameDocument)
            
            // const eChartsDiv = iFrameDocument.getElementById("main")
            // console.log("echarts div is ", eChartsDiv)
            // var myChart = echarts.init(document.getElementById('rajatiframe'));
            
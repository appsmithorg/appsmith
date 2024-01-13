/\*\*

Message protocol between the iframe widget and the main widget

Message Types:

1. click-event
   When a user clicks a datapoint on the chart, iframe sends this to iframe widget wrapper. The event data includes the details of the point clicked by the user.
2. load-complete
   When the iframe has finished loading, it sends this message to the iframe wrapper to let them know. Wrapper then sends the inital chart data to iframe that it needs to render.
3. error
   If there is an exception in setting any chart options, iframe sends this message to the wrapper. It sends the message and stack as string arguments to the wrapper.
4. update-options
   The wrapper sends this message to the iframe to send the options that it would like the iframe to render. It also sends other metata required for rendering those options in the message.

\*/

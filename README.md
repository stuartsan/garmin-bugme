This is a Lambda function that runs once per day. It opens a web browser, logs into my Garmin connect account, checks my average steps per day for the last seven days, and if it's lower than I'd like, sends me a text message as a reminder to move around some more.

How to use it:

- install [serverless](https://serverless.com/framework/docs/providers/aws/guide/installation/) and get set up for use with AWS
- clone this repo
- in the project root create a file called config.yml that looks like this:

```
USER: mygarminconnectemail@cooltimes.web.net
PASSWORD: mygarminconnectpassword
STEPS_GOAL: 10000
PHONE_NUMBER: "+15415551212"
```
- `serverless deploy`

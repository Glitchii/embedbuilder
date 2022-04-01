# An embed visualizer

Visualize embed or message content from JSON input or provided GUI editor.

This can be used for discord bot embed commands. It can also be intergreted into your Discord bot's website.  

Aside the JSON editor, it also includes a GUI editor which converts to JSON for simplicity.  

![GUI image](https://raw.githubusercontent.com/Glitchii/embedbuilder/master/assets/media/gui.png) ![JSON image](https://raw.githubusercontent.com/Glitchii/embedbuilder/master/assets/media/json.png)  


# Supported URL Parameters

## Editor param (/?editor=json)
The GUI editor is used by default. If 'editor' parameter is set with it's value set to "json", the website will use the JSON editor by default instead. Setting the value to anything else other than 'json' will be ignored.

Example URL: https://glitchii.github.io/embedbuilder/?editor=json


## Data param (/?data=...)
A data param is used to specify the dafault json data to be used when the website loads. **Note** that value of the data param should be URL encoded first, then base64 encoded last because some characters like emojis can't be Base64 encoded alone. Calling the `jsonToBase64()` or `jsonToBase64(json, true)` function does that for you and returns the encoded JSON data.

Example URL:  
https://glitchii.github.io/embedbuilder/?data=JTdCJTIyZW1iZWQlMjIlM0ElN0IlMjJ0aXRsZSUyMiUzQSUyMkxvcmVtJTIwaXBzdW0lMjIlMkMlMjJkZXNjcmlwdGlvbiUyMiUzQSUyMkRvbG9yJTIwc2l0JTIwYW1ldC4uLiUyMiUyQyUyMmNvbG9yJTIyJTNBMzkxMjklN0QlN0Q=

## Other parameters
Params that end with `=` in the list below need a value, those that don't will always be truthy when set either with or with no value.
```
Parameter               Description
---------               -----------
username=               Used to set the default name of the bot.
avatar=                 Avatar for the bot. Either URL encode it or make this the last param.
verified                Displays a verified badge on the bot tag when set to true.
reverse                 Reverse the preview and editors position.
nouser                  Display embed or message content with no username or avatar.
embed                   Display only the embed, no editor.
guitabs=                Specify what gui tabs to display comma seperated.
                        Example: `guitabs=author` or `guitabs=image,footer`
placeholders            Silences some warrnings, e.g. warrnings about missing url protocols or incorrect footer timestamps.
                        With this param, automatic insertion of the 'http' protocol for urls written without a protocol is also disabled.
                        This param is useful when your bot allows having placeholders in place of a URL eg. `{ server.url }`
placeholders=errors     This also disables automatic insertion of 'http' for urls without a protocol.
                        Except, warnings won't be silenced. The user will still see a warning that a url or timestamp (etc.) is incorrect for 5 seconds.
hideditor               Hides the editor.
hidepreview             Hides the preview.
hidemenu                Hides the three dotted menu.
```
<small>Case matters, all parameters should be lowercase.</small>
### Example URL with all* the above parameters:
https://glitchii.github.io/embedbuilder/?username=Troy&verified&reverse&guitabs=image,footer&avatar=https://cdn.discordapp.com/avatars/663074487335649292/576eb5f13519b9da10ba7807bdd83fab.webp

### Alternative to URL options:
This will only work on a cloned repo of the builder: Have a JavaScript config file named `builder.config.js`. In this file, define `window.options` to an object containing the params.  Note that some param names and cases will be different from the URL ones. An example [builder.config.js](/builder.config.js) file is included in the repo. The config file is loaded before the [main script](/assets/js/script.js) and because it's a JS file, you can do and probably alter anything else.

>## Intergretting into your website
>You are free to use this in your website. Intergretting into your websites allows sending the embed to Discord with a few changes, and using 'formatters' eg. '{ server.name }' or '{ user.name }' etc. A (not so bad) downside would be that you'd probably have to keep up with fixes and updates.
<br>
To over come that, and if all you want is to have an embed builder in your website with no additional features and maybe using your own bot name and avatar, etc., then you might iframe https://glitchii.github.io/embedbuilder into your website with a few of the parameters above if needed instead. The downside to this is that due to security reasons, browsers won't allow features like updating URL parameter to work through iframes, whoever URL options will still be read from the top holder of the iframe, those are probably the only features that won't work and thus are removed from the GUI menu when embeded in iframe. `builder.config.js` also won't be seen in iframe


<br><br>
You can look into the [project boards](https://github.com/Glitchii/embedbuilder/projects/3) to see what is being worked on or want to contribute.  
<br>
<small> Example integration: https://troybot.xyz/embed</small>  
[To Do](https://github.com/Glitchii/embedbuilder/projects/3) | [Discussions](https://github.com/Glitchii/embedbuilder/discussions/1)

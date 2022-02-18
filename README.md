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
Parameter   Description
---------   -----------
username=   Used to set the default name of the bot.
avatar=     If a valid URL is given, that will be the avatar or icon of the bot.
verified    Displays a verified badge on the bot tag when set to true.
reverse     Reverse the preview and editors position.
nouser      Display embed or message content with no username or avatar.
embed       Display only the embed, no editor.
guitabs=    Specify what gui tabs to display comma seperated.
            Example: `guitabs=author` or `guitabs=image,footer`
```
### Example URL with all the above parameters:
https://glitchii.github.io/embedbuilder/?username=Troy&verified&reverse&guitabs=image,footer&avatar=https://cdn.discordapp.com/avatars/663074487335649292/576eb5f13519b9da10ba7807bdd83fab.webp

>## Intergretting into your website
>You are free to use this in your website. Intergretting into your websites allows sending the embed to Discord with a few changes, and using 'formmaters' eg. '{ server_name }' or '{ user_name }' etc. A (not so bad) downside would be that you'd probably have to keep up with fixes and updates.  
If all you want is to have an embed builder in your website with no additional features and maybe using your own bot name and avatar, etc., then you should iframe https://glitchii.github.io/embedbuilder into your website with a few of the parameters above if needed instead.


<br><br>
You can look into the [project boards](https://github.com/Glitchii/embedbuilder/projects/3) to see what is being worked on or want to contribute.  
<br>
<small> Example integration: https://troybot.xyz/embed</small>  
[To Do](https://github.com/Glitchii/embedbuilder/projects/3) | [Discussions](https://github.com/Glitchii/embedbuilder/discussions/1)
/**
 * This script file will (or atleast should) run before the main script file runs.
 * This file should contain stuff like options, global variables (etc.) to be used by the main script.
 * */

// Options

// URL options can override the options below.
// Options set through the menu can override both.
options = {
    username: 'Discord Bot',
    avatar: 'https://cdn.discordapp.com/embed/avatars/1.png',
    verified: false,
    noUser: false,
    dataSpecified: false,
    guiTabs: ['author', 'description'],
    useJsonEditor: false,
    reverseColumns: false,
    allowPlaceholders: false,
    autoUpdateURL: false,
    autoParams: false,
    hideEditor: false,
    hidePreview: false,
    hideMenu: false,
    multiEmbeds: false,
    noMultiEmbedsOption: false,
}

// Default JSON object

// json = {
//     content: "Hello world",
//     embed: {
//         title: "A title",
//         description: "A description",
//     }
// }


// Write any code under the 'DOMContentLoaded' event to run after the page has loaded.
addEventListener('DOMContentLoaded', () => {
    // console.log('Hello 👋');

    // Remove the colour picker
    // document.querySelector('.colors').remove()
})
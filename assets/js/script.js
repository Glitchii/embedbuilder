/**
 * Discord Embed Builder
 * Contribute or report issues at
 * https://github.com/Glitchii/embedbuilder
 */

window.options ??= {};
window.inIframe ??= top !== self;
mainHost = "glitchii.github.io";

let params = new URLSearchParams(location.search),
    hasParam = param => params.get(param) !== null,
    dataSpecified = options.data || params.get('data'),
    username = params.get('username') || options.username,
    avatar = params.get('avatar') || options.avatar,
    guiTabs = params.get('guitabs') || options.guiTabs,
    useJsonEditor = params.get('editor') === 'json' || options.useJsonEditor,
    verified = hasParam('verified') || options.verified,
    reverseColumns = hasParam('reverse') || options.reverseColumns,
    noUser = localStorage.getItem('noUser') || hasParam('nouser') || options.noUser,
    onlyEmbed = hasParam('embed') || options.onlyEmbed,
    allowPlaceholders = hasParam('placeholders') || options.allowPlaceholders,
    autoUpdateURL = localStorage.getItem('autoUpdateURL') || options.autoUpdateURL,
    noMultiEmbedsOption = localStorage.getItem('noMultiEmbedsOption') || hasParam('nomultiembedsoption') || options.noMultiEmbedsOption,
    single = noMultiEmbedsOption ? options.single ?? true : (localStorage.getItem('single') || hasParam('single') || options.single) ?? false,
    multiEmbeds = !single,
    autoParams = localStorage.getItem('autoParams') || hasParam('autoparams') || options.autoParams,
    hideEditor = localStorage.getItem('hideeditor') || hasParam('hideeditor') || options.hideEditor,
    hidePreview = localStorage.getItem('hidepreview') || hasParam('hidepreview') || options.hidePreview,
    hideMenu = localStorage.getItem('hideMenu') || hasParam('hidemenu') || options.hideMenu,
    sourceOption = localStorage.getItem('sourceOption') || hasParam('sourceoption') || options.sourceOption,
    // sourceInMenu = localStorage.getItem('sourceInMenu') || hasParam('sourceInMenu') || options.sourceInMenu || top.location.host === mainHost,
    validationError, activeFields, lastActiveGuiEmbedIndex = -1, lastGuiJson, colNum = 1, num = 0;

const guiEmbedIndex = guiEl => {
    const guiEmbed = guiEl?.closest('.guiEmbed');
    const gui = guiEmbed?.closest('.gui')

    return !gui ? -1 : Array.from(gui.querySelectorAll('.guiEmbed')).indexOf(guiEmbed)
}

const toggleStored = item => {
    const found = localStorage.getItem(item);
    if (!found)
        return localStorage.setItem(item, true);

    localStorage.removeItem(item);
    return found;
};

const createElement = object => {
    let element;
    for (const tag in object) {
        element = document.createElement(tag);

        for (const attr in object[tag])
            if (attr !== 'children') element[attr] = object[tag][attr];
            else for (const child of object[tag][attr])
                element.appendChild(createElement(child));

    }

    return element;
}

const encodeJson = (jsonCode, withURL = false, redirect = false) => {
    let data = btoa(encodeURIComponent((JSON.stringify(typeof jsonCode === 'object' ? jsonCode : json))));
    let url = new URL(location.href);

    if (withURL) {
        url.searchParams.set('data', data);
        if (redirect)
            return top.location.href = url;

        data = url.href
            // Replace %3D ('=' url encoded) with '='
            .replace(/data=\w+(?:%3D)+/g, 'data=' + data);
    }

    return data;
};

const decodeJson = data => {
    const jsonData = decodeURIComponent(atob(data || dataSpecified));
    return typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;
};

// IMPORTANT: jsonToBase64 and base64ToJson are subject to removal in the future.
// Use encodeJson and decodeJson instead (they are aliases)
let jsonToBase64 = encodeJson, base64ToJson = decodeJson;


const toRGB = (hex, reversed, integer) => {
    if (reversed) return '#' + hex.match(/\d+/g).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
    if (integer) return parseInt(hex.match(/\d+/g).map(x => parseInt(x).toString(16).padStart(2, '0')).join(''), 16);
    if (hex.includes(',')) return hex.match(/\d+/g);
    hex = hex.replace('#', '').match(/.{1,2}/g)
    return [parseInt(hex[0], 16), parseInt(hex[1], 16), parseInt(hex[2], 16), 1];
};

const reverse = (reversed, callback) => {
    const side = document.querySelector(reversed ? '.side2' : '.side1');
    if (side.nextElementSibling) side.parentElement.insertBefore(side.nextElementSibling, side);
    else side.parentElement.insertBefore(side, side.parentElement.firstElementChild);

    const isReversed = document.body.classList.toggle('reversed');
    if (autoParams) isReversed ? urlOptions({ set: ['reverse', ''] }) : urlOptions({ remove: 'reverse' });
};

const urlOptions = ({ remove, set }) => {
    const url = new URL(location.href);
    if (remove) url.searchParams.delete(remove);
    if (set) url.searchParams.set(set[0], set[1]);
    
    try {
        history.replaceState(null, null, url.href.replace(/(?<!data=[^=]+|=)=(&|$)/g, x => x === '=' ? '' : '&'));
    } catch (e) {
        // 'SecurityError' when trying to change the url of a different origin
        // e.g. when trying to change the url of the parent window from an iframe
        console.info(e);
    }
};

const animateGuiEmbedNameAt = (i, text) => {
    const guiEmbedName = document.querySelectorAll('.gui .guiEmbedName')?.[i];
    // Shake animation
    guiEmbedName?.animate(
        [{ transform: 'translate(0, 0)' },
        { transform: 'translate(10px, 0)' },
        { transform: 'translate(0, 0)' }],
        { duration: 100, iterations: 3 });

    text && (guiEmbedName?.style.setProperty('--text', `"${text}"`));

    guiEmbedName?.scrollIntoView({ behavior: "smooth", block: "center" });
    guiEmbedName?.classList.remove('empty');
    setTimeout(() => guiEmbedName?.classList.add('empty'), 10);
}

const indexOfEmptyGuiEmbed = text => {
    for (const [i, element] of document.querySelectorAll('.msgEmbed>.container .embed').entries())
        if (element.classList.contains('emptyEmbed')) {
            text !== false && animateGuiEmbedNameAt(i, text);
            return i;
        }

    for (const [i, embedObj] of (json.embeds || []).entries())
        if (!(0 in Object.keys(embedObj))) {
            text !== false && animateGuiEmbedNameAt(i, text);
            return i;
        }

    return -1;
}

const changeLastActiveGuiEmbed = index => {
    const pickerEmbedText = document.querySelector('.colors .cTop .embedText>span');

    if (index === -1) {
        lastActiveGuiEmbedIndex = -1;
        return pickerEmbedText.textContent = '';
    }

    lastActiveGuiEmbedIndex = index;

    if (pickerEmbedText) {
        pickerEmbedText.textContent = index + 1;

        const guiEmbedNames = document.querySelectorAll('.gui .item.guiEmbedName');
        pickerEmbedText.onclick = () => {
            const newIndex = parseInt(prompt('Enter an embed number' + (guiEmbedNames.length > 1 ? `, 1 - ${guiEmbedNames.length}` : ''), index + 1));
            if (isNaN(newIndex)) return;
            if (newIndex < 1 || newIndex > guiEmbedNames.length)
                return error(guiEmbedNames.length === 1 ? `'${newIndex}' is not a valid embed number` : `'${newIndex}' doesn't seem like a number between 1 and ${guiEmbedNames.length}`);

            changeLastActiveGuiEmbed(newIndex - 1);
        }
    }
}

// Called after building embed for extra work.
const afterBuilding = () => autoUpdateURL && urlOptions({ set: ['data', encodeJson(json)] });
// Parses emojis to images and adds code highlighting.
const externalParsing = ({ noEmojis, element } = {}) => {
    !noEmojis && twemoji.parse(element || document.querySelector('.msgEmbed'), { base: 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/' });
    for (const block of document.querySelectorAll('.markup pre > code'))
        hljs.highlightBlock(block);

    const embed = element?.closest('.embed');
    if (embed?.innerText.trim())
        (multiEmbeds ? embed : document.body).classList.remove('emptyEmbed');

    afterBuilding()
};

let embedKeys = ["author", "footer", "color", "thumbnail", "image", "fields", "title", "description", "url", "timestamp"];
let mainKeys = ["embed", "embeds", "content"];
let allJsonKeys = [...mainKeys, ...embedKeys];

// 'jsonObject' is used internally, do not change it's value. Assign to 'json' instead.
// 'json' is the object that is used to build the embed. Assigning to it also updates the editor.
let jsonObject = window.json || {
    content: "You can~~not~~ do `this`.```py\nAnd this.\nprint('Hi')```\n*italics* or _italics_     __*underline italics*__\n**bold**     __**underline bold**__\n***bold italics***  __***underline bold italics***__\n__underline__     ~~Strikethrough~~",
    embed: {
        title: "Hello ~~people~~ world :wave:",
        description: "You can use [links](https://discord.com) or emojis :smile: 😎\n```\nAnd also code blocks\n```",
        color: 0x41f097,
        timestamp: new Date().toISOString(),
        url: "https://discord.com",
        author: {
            name: "Author name",
            url: "https://discord.com",
            icon_url: "https://cdn.discordapp.com/embed/avatars/0.png"
        },
        thumbnail: {
            url: "https://cdn.discordapp.com/embed/avatars/0.png"
        },
        image: {
            url: "https://glitchii.github.io/embedbuilder/assets/media/banner.png"
        },
        footer: {
            text: "Footer text",
            icon_url: "https://cdn.discordapp.com/embed/avatars/0.png"
        },
        fields: [
            {
                name: "Field 1, *lorem* **ipsum**, ~~dolor~~",
                value: "Field value"
            },
            {
                name: "Field 2",
                value: "You can use custom emojis <:Kekwlaugh:722088222766923847>. <:GangstaBlob:742256196295065661>",
                inline: false
            },
            {
                name: "Inline field",
                value: "Fields can be inline",
                inline: true
            },
            {
                name: "Inline field",
                value: "*Lorem ipsum*",
                inline: true
            },
            {
                name: "Inline field",
                value: "value",
                inline: true
            },
            {
                name: "Another field",
                value: "> Nope, didn't forget about this",
                inline: false
            }
        ]
    }
}

if (dataSpecified)
    jsonObject = decodeJson();

if (allowPlaceholders)
    allowPlaceholders = params.get('placeholders') === 'errors' ? 1 : 2;

// Even if not in multi-embed mode, 'jsonObject' should always have an array 'embeds'
// To get the right json object that includes either 'embeds' or 'embed' if not in multi-embed mode,
// print 'json' (global variable) instead of 'jsonObject', jsonObject is used internally, you shouldn't modify it.
if (multiEmbeds && !jsonObject.embeds?.length)
    jsonObject.embeds = jsonObject.embed ? [jsonObject.embed] : [];
else if (!multiEmbeds)
    jsonObject.embeds = jsonObject.embeds?.[0] ? [jsonObject.embeds[0]] : jsonObject.embed ? [jsonObject.embed] : [];

delete jsonObject.embed;

addEventListener('DOMContentLoaded', () => {
    if (reverseColumns || localStorage.getItem('reverseColumns'))
        reverse();
    if (autoParams)
        document.querySelector('.item.auto-params > input').checked = true;
    if (hideMenu)
        document.querySelector('.top-btn.menu')?.classList.add('hidden');
    if (noMultiEmbedsOption)
        document.querySelector('.box .item.multi')?.remove();
    if (inIframe)
        // Remove menu options that don't work in iframe.
        for (const e of document.querySelectorAll('.no-frame'))
            e.remove();

    if (autoUpdateURL) {
        document.body.classList.add('autoUpdateURL');
        document.querySelector('.item.auto > input').checked = true;
    }

    if (single) {
        document.body.classList.add('single');
        if (autoParams)
            single ? urlOptions({ set: ['single', ''] }) : urlOptions({ remove: 'single' });
    }

    if (hideEditor) {
        document.body.classList.add('no-editor');
        document.querySelector('.toggle .toggles .editor input').checked = false;
    }

    if (hidePreview) {
        document.body.classList.add('no-preview');
        document.querySelector('.toggle .toggles .preview input').checked = false;
    }

    if (onlyEmbed) document.body.classList.add('only-embed');
    else {
        document.querySelector('.side1.noDisplay')?.classList.remove('noDisplay');
        if (useJsonEditor)
            document.body.classList.remove('gui');
    }

    if (noUser) {
        document.body.classList.add('no-user');
        if (autoParams)
            noUser ? urlOptions({ set: ['nouser', ''] }) : urlOptions({ remove: 'nouser' });
    }

    else {
        if (username) document.querySelector('.username').textContent = username;
        if (avatar) document.querySelector('.avatar').src = avatar;
        if (verified) document.querySelector('.msgEmbed > .contents').classList.add('verified');
    }

    for (const e of document.querySelectorAll('.clickable > img'))
        e.parentElement.addEventListener('mouseup', el => window.open(el.target.src));

    const editorHolder = document.querySelector('.editorHolder'),
        guiParent = document.querySelector('.top'),
        embedContent = document.querySelector('.messageContent'),
        embedCont = document.querySelector('.msgEmbed>.container'),
        gui = guiParent.querySelector('.gui:first-of-type');

    editor = CodeMirror(elt => editorHolder.parentNode.replaceChild(elt, editorHolder), {
        value: JSON.stringify(json, null, 4),
        gutters: ["CodeMirror-foldgutter", "CodeMirror-lint-markers"],
        scrollbarStyle: "overlay",
        mode: "application/json",
        theme: 'material-darker',
        matchBrackets: true,
        foldGutter: true,
        lint: true,
        extraKeys: {
            // Fill in indent spaces on a new line when enter (return) key is pressed.
            Enter: _ => {
                const cursor = editor.getCursor();
                const end = editor.getLine(cursor.line);
                const leadingSpaces = end.replace(/\S($|.)+/g, '') || '    \n';
                const nextLine = editor.getLine(cursor.line + 1);

                if ((nextLine === undefined || !nextLine.trim()) && !end.substr(cursor.ch).trim())
                    editor.replaceRange('\n', { line: cursor.line, ch: cursor.ch });
                else
                    editor.replaceRange(`\n${end.endsWith('{') ? leadingSpaces + '    ' : leadingSpaces}`, {
                        line: cursor.line,
                        ch: cursor.ch
                    });
            },
        }
    });

    editor.focus();

    const notif = document.querySelector('.notification');

    error = (msg, time = '5s') => {
        notif.innerHTML = msg;
        notif.style.removeProperty('--startY');
        notif.style.removeProperty('--startOpacity');
        notif.style.setProperty('--time', time);
        notif.onanimationend = () => notif.style.display = null;

        // If notification element is not already visible, (no other message is already displayed), display it.
        if (!notif.style.display)
            return notif.style.display = 'block', false;

        // If there's a message already displayed, update it and delay animating out.
        notif.style.setProperty('--startY', 0);
        notif.style.setProperty('--startOpacity', 1);
        notif.style.display = null;
        setTimeout(() => notif.style.display = 'block', .5);

        return false;
    };

    const url = (url) => /^(https?:)?\/\//g.exec(url) ? url : '//' + url;

    const makeShort = (txt, length, mediaWidth) => {
        if (mediaWidth && matchMedia(`(max-width:${mediaWidth}px)`).matches)
            return txt.length > (length - 3) ? txt.substring(0, length - 3) + '...' : txt;
        return txt;
    }

    const allGood = embedObj => {
        let invalid, err;
        let str = JSON.stringify(embedObj, null, 4)
        let re = /("(?:icon_)?url": *")((?!\w+?:\/\/).+)"/g.exec(str);

        if (embedObj.timestamp && new Date(embedObj.timestamp).toString() === "Invalid Date") {
            if (allowPlaceholders === 2) return true;
            if (!allowPlaceholders) invalid = true, err = 'Timestamp is invalid';
        } else if (re) { // If a URL is found without a protocol
            if (!/\w+:|\/\/|^\//g.exec(re[2]) && re[2].includes('.')) {
                let activeInput = document.querySelector('input[class$="link" i]:focus')
                if (activeInput && !allowPlaceholders) {
                    lastPos = activeInput.selectionStart + 7;
                    activeInput.value = `http://${re[2]}`;
                    activeInput.setSelectionRange(lastPos, lastPos)
                    return true;
                }
            }
            if (allowPlaceholders !== 2)
                invalid = true, err = (`URL should have a protocol. Did you mean <span class="inline full short">http://${makeShort(re[2], 30, 600).replace(' ', '')}</span>?`);
        }

        if (invalid) {
            validationError = true;
            return error(err);
        }

        return true;
    }

    const markup = (txt, { replaceEmojis, inlineBlock, inEmbed }) => {
        if (replaceEmojis)
            txt = txt.replace(/(?<!code(?: \w+=".+")?>[^>]+)(?<!\/[^\s"]+?):((?!\/)\w+):/g, (match, p) => p && emojis[p] ? emojis[p] : match);

        txt = txt
            /** Markdown */
            .replace(/&#60;:\w+:(\d{17,19})&#62;/g, '<img class="emoji" src="https://cdn.discordapp.com/emojis/$1.png"/>')
            .replace(/&#60;a:\w+:(\d{17,20})&#62;/g, '<img class="emoji" src="https://cdn.discordapp.com/emojis/$1.gif"/>')
            .replace(/~~(.+?)~~/g, '<s>$1</s>')
            .replace(/\*\*\*(.+?)\*\*\*/g, '<em><strong>$1</strong></em>')
            .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
            .replace(/__(.+?)__/g, '<u>$1</u>')
            .replace(/\*(.+?)\*/g, '<em>$1</em>')
            .replace(/_(.+?)_/g, '<em>$1</em>')
            // Replace >>> and > with block-quotes. &#62; is HTML code for >
            .replace(/^(?: *&#62;&#62;&#62; ([\s\S]*))|(?:^ *&#62;(?!&#62;&#62;) +.+\n)+(?:^ *&#62;(?!&#62;&#62;) .+\n?)+|^(?: *&#62;(?!&#62;&#62;) ([^\n]*))(\n?)/mg, (all, match1, match2, newLine) => {
                return `<div class="blockquote"><div class="blockquoteDivider"></div><blockquote>${match1 || match2 || newLine ? match1 || match2 : all.replace(/^ *&#62; /gm, '')}</blockquote></div>`;
            })

            /** Mentions */
            .replace(/&#60;#\d+&#62;/g, () => `<span class="mention channel interactive">channel</span>`)
            .replace(/&#60;@(?:&#38;|!)?\d+&#62;|@(?:everyone|here)/g, match => {
                if (match.startsWith('@')) return `<span class="mention">${match}</span>`
                else return `<span class="mention interactive">@${match.includes('&#38;') ? 'role' : 'user'}</span>`
            })

        if (inlineBlock)
            // Treat both inline code and code blocks as inline code
            txt = txt.replace(/`([^`]+?)`|``([^`]+?)``|```((?:\n|.)+?)```/g, (m, x, y, z) => x ? `<code class="inline">${x}</code>` : y ? `<code class="inline">${y}</code>` : z ? `<code class="inline">${z}</code>` : m);
        else {
            // Code block
            txt = txt.replace(/```(?:([a-z0-9_+\-.]+?)\n)?\n*([^\n][^]*?)\n*```/ig, (m, w, x) => {
                if (w) return `<pre><code class="${w}">${x.trim()}</code></pre>`
                else return `<pre><code class="hljs nohighlight">${x.trim()}</code></pre>`
            });
            // Inline code
            txt = txt.replace(/`([^`]+?)`|``([^`]+?)``/g, (m, x, y, z) => x ? `<code class="inline">${x}</code>` : y ? `<code class="inline">${y}</code>` : z ? `<code class="inline">${z}</code>` : m)
        }

        if (inEmbed)
            txt = txt.replace(/\[([^\[\]]+)\]\((.+?)\)/g, `<a title="$1" target="_blank" class="anchor" href="$2">$1</a>`);

        return txt;
    }


    const createEmbedFields = (fields, embedFields) => {
        embedFields.innerHTML = '';
        let index, gridCol;

        for (const [i, f] of fields.entries()) {
            if (f.name && f.value) {
                const fieldElement = embedFields.insertBefore(document.createElement('div'), null);
                // Figuring out if there are only two fields on a row to give them more space.
                // e.fields = json.embeds.fields.

                // if both the field of index 'i' and the next field on it's right are inline and -
                if (fields[i].inline && fields[i + 1]?.inline &&
                    // it's the first field in the embed or -
                    ((i === 0 && fields[i + 2] && !fields[i + 2].inline) || ((
                        // it's not the first field in the embed but the previous field is not inline or - 
                        i > 0 && !fields[i - 1].inline ||
                        // it has 3 or more fields behind it and 3 of those are inline except the 4th one back if it exists -
                        i >= 3 && fields[i - 1].inline && fields[i - 2].inline && fields[i - 3].inline && (fields[i - 4] ? !fields[i - 4].inline : !fields[i - 4])
                        // or it's the first field on the last row or the last field on the last row is not inline or it's the first field in a row and it's the last field on the last row.
                    ) && (i == fields.length - 2 || !fields[i + 2].inline))) || i % 3 === 0 && i == fields.length - 2) {
                    // then make the field halfway (and the next field will take the other half of the embed).
                    index = i, gridCol = '1 / 7';
                }
                // The next field.
                if (index === i - 1)
                    gridCol = '7 / 13';

                if (!f.inline)
                    fieldElement.outerHTML = `
                        <div class="embedField" style="grid-column: 1 / 13;">
                            <div class="embedFieldName">${markup(encodeHTML(f.name), { inEmbed: true, replaceEmojis: true, inlineBlock: true })}</div>
                            <div class="embedFieldValue">${markup(encodeHTML(f.value), { inEmbed: true, replaceEmojis: true })}</div>
                        </div>`;
                else {
                    if (i && !fields[i - 1].inline) colNum = 1;

                    fieldElement.outerHTML = `
                        <div class="embedField ${num}${gridCol ? ' colNum-2' : ''}" style="grid-column: ${gridCol || (colNum + ' / ' + (colNum + 4))};">
                            <div class="embedFieldName">${markup(encodeHTML(f.name), { inEmbed: true, replaceEmojis: true, inlineBlock: true })}</div>
                            <div class="embedFieldValue">${markup(encodeHTML(f.value), { inEmbed: true, replaceEmojis: true })}</div>
                        </div>`;

                    if (index !== i) gridCol = false;
                }

                colNum = (colNum === 9 ? 1 : colNum + 4);
                num++;
            };
        };


        for (const e of document.querySelectorAll('.embedField[style="grid-column: 1 / 5;"]'))
            if (!e.nextElementSibling || e.nextElementSibling.style.gridColumn === '1 / 13')
                e.style.gridColumn = '1 / 13';
        colNum = 1;

        display(embedFields, undefined, 'grid');
    }

    const smallerScreen = matchMedia('(max-width: 1015px)');

    const encodeHTML = str => str.replace(/[\u00A0-\u9999<>\&]/g, i => '&#' + i.charCodeAt(0) + ';');

    const timestamp = stringISO => {
        const date = stringISO ? new Date(stringISO) : new Date(),
            dateArray = date.toLocaleString('en-US', { hour: 'numeric', hour12: false, minute: 'numeric' }),
            today = new Date(),
            yesterday = new Date(new Date().setDate(today.getDate() - 1)),
            tommorrow = new Date(new Date().setDate(today.getDate() + 1));

        return today.toDateString() === date.toDateString() ? `Today at ${dateArray}` :
            yesterday.toDateString() === date.toDateString() ? `Yesterday at ${dateArray}` :
                tommorrow.toDateString() === date.toDateString() ? `Tomorrow at ${dateArray}` :
                    `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
    }

    const display = (el, data, displayType) => {
        if (data) el.innerHTML = data;
        el.style.display = displayType || "unset";
    }

    const hide = el => el.style.removeProperty('display'),
        imgSrc = (elm, src, remove) => remove ? elm.style.removeProperty('content') : elm.style.content = `url(${src})`;

    const [guiFragment, fieldFragment, embedFragment, guiEmbedAddFragment] = Array.from({ length: 4 }, () => document.createDocumentFragment());
    embedFragment.appendChild(document.querySelector('.embed.markup').cloneNode(true));
    guiEmbedAddFragment.appendChild(document.querySelector('.guiEmbedAdd').cloneNode(true));
    fieldFragment.appendChild(document.querySelector('.edit>.fields>.field').cloneNode(true));

    document.querySelector('.embed.markup').remove();
    gui.querySelector('.edit>.fields>.field').remove();

    for (const child of gui.childNodes)
        guiFragment.appendChild(child.cloneNode(true));

    // Renders the GUI editor with json data from 'jsonObject'.
    buildGui = (object = jsonObject, opts) => {
        gui.innerHTML = '';
        gui.appendChild(guiEmbedAddFragment.firstChild.cloneNode(true))
            .addEventListener('click', () => {
                if (indexOfEmptyGuiEmbed('(empty embed)') !== -1) return;
                jsonObject.embeds.push({});
                buildGui();
            });

        for (const child of Array.from(guiFragment.childNodes)) {
            if (child.classList?.[1] === 'content')
                gui.insertBefore(gui.appendChild(child.cloneNode(true)), gui.appendChild(child.nextElementSibling.cloneNode(true))).nextElementSibling.firstElementChild.value = object.content || '';
            else if (child.classList?.[1] === 'guiEmbedName') {
                for (const [i, embed] of (object.embeds.length ? object.embeds : [{}]).entries()) {
                    const guiEmbedName = gui.appendChild(child.cloneNode(true))

                    guiEmbedName.querySelector('.text').innerHTML = `Embed ${i + 1}${embed.title ? `: <span>${embed.title}</span>` : ''}`;
                    guiEmbedName.querySelector('.icon').addEventListener('click', () => {
                        object.embeds.splice(i, 1);
                        buildGui();
                        buildEmbed();
                    });

                    const guiEmbed = gui.appendChild(createElement({ 'div': { className: 'guiEmbed' } }));
                    const guiEmbedTemplate = child.nextElementSibling;

                    for (const child2 of Array.from(guiEmbedTemplate.children)) {
                        if (!child2?.classList.contains('edit')) {
                            const row = guiEmbed.appendChild(child2.cloneNode(true));
                            const edit = child2.nextElementSibling?.cloneNode(true);
                            edit?.classList.contains('edit') && guiEmbed.appendChild(edit);

                            switch (child2.classList[1]) {
                                case 'author':
                                    const authorURL = embed?.author?.icon_url || '';
                                    if (authorURL)
                                        edit.querySelector('.imgParent').style.content = 'url(' + encodeHTML(authorURL) + ')';
                                    edit.querySelector('.editAuthorLink').value = authorURL;
                                    edit.querySelector('.editAuthorName').value = embed?.author?.name || '';
                                    break;
                                case 'title':
                                    row.querySelector('.editTitle').value = embed?.title || '';
                                    break;
                                case 'description':
                                    edit.querySelector('.editDescription').value = embed?.description || '';
                                    break;
                                case 'thumbnail':
                                    const thumbnailURL = embed?.thumbnail?.url || '';
                                    if (thumbnailURL)
                                        edit.querySelector('.imgParent').style.content = 'url(' + encodeHTML(thumbnailURL) + ')';
                                    edit.querySelector('.editThumbnailLink').value = thumbnailURL;
                                    break;
                                case 'image':
                                    const imageURL = embed?.image?.url || '';
                                    if (imageURL)
                                        edit.querySelector('.imgParent').style.content = 'url(' + encodeHTML(imageURL) + ')';
                                    edit.querySelector('.editImageLink').value = imageURL;
                                    break;
                                case 'footer':
                                    const footerURL = embed?.footer?.icon_url || '';
                                    if (footerURL)
                                        edit.querySelector('.imgParent').style.content = 'url(' + encodeHTML(footerURL) + ')';
                                    edit.querySelector('.editFooterLink').value = footerURL;
                                    edit.querySelector('.editFooterText').value = embed?.footer?.text || '';
                                    break;
                                case 'fields':
                                    for (const f of embed?.fields || []) {
                                        const fields = edit.querySelector('.fields');
                                        const field = fields.appendChild(createElement({ 'div': { className: 'field' } }));

                                        for (const child of Array.from(fieldFragment.firstChild.children)) {
                                            const newChild = field.appendChild(child.cloneNode(true));

                                            if (child.classList.contains('inlineCheck'))
                                                newChild.querySelector('input').checked = !!f.inline;

                                            else if (f.value && child.classList?.contains('fieldInner'))
                                                newChild.querySelector('.designerFieldName input').value = f.name || '',
                                                    newChild.querySelector('.designerFieldValue textarea').value = f.value || '';
                                        }
                                    }
                            }
                        }
                    }
                }
            }

            // Expand last embed in GUI
            const names = gui.querySelectorAll('.guiEmbedName');
            names[names.length - 1]?.classList.add('active');
        }

        for (const e of document.querySelectorAll('.top>.gui .item'))
            e.addEventListener('click', el => {
                if (e?.classList.contains('active'))
                    getSelection().anchorNode !== e && e.classList.remove('active');
                else if (e) {
                    const inlineField = e.closest('.inlineField'),
                        input = e.nextElementSibling?.querySelector('input[type="text"]'),
                        txt = e.nextElementSibling?.querySelector('textarea');

                    e.classList.add('active');
                    if (e.classList.contains('guiEmbedName'))
                        return changeLastActiveGuiEmbed(guiEmbedIndex(e));

                    else if (inlineField)
                        inlineField.querySelector('.ttle~input').focus();

                    else if (e.classList.contains('footer')) {
                        const date = new Date(jsonObject.embeds[guiEmbedIndex(e)]?.timestamp || new Date());
                        const textElement = e.nextElementSibling.querySelector('svg>text');
                        const dateInput = textElement.closest('.footerDate').querySelector('input');

                        return (
                            textElement.textContent = (date.getDate() + '').padStart(2, 0),
                            dateInput.value = date.toISOString().substring(0, 19)
                        );
                    }

                    else if (input) {
                        !smallerScreen.matches && input.focus();
                        input.selectionStart = input.selectionEnd = input.value.length;
                    }

                    else if (txt && !smallerScreen.matches)
                        txt.focus();

                    if (e.classList.contains('fields')) {
                        if (reverseColumns && smallerScreen.matches)
                            // return elm.nextElementSibling.scrollIntoView({ behavior: 'smooth', block: "end" });
                            return e.parentNode.scrollTop = e.offsetTop;

                        e.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                }
            })

        content = gui.querySelector('.editContent');
        title = gui.querySelector('.editTitle');
        authorName = gui.querySelector('.editAuthorName');
        authorLink = gui.querySelector('.editAuthorLink');
        desc = gui.querySelector('.editDescription');
        thumbLink = gui.querySelector('.editThumbnailLink');
        imgLink = gui.querySelector('.editImageLink');
        footerText = gui.querySelector('.editFooterText');
        footerLink = gui.querySelector('.editFooterLink');

        // Scroll into view when tabs are opened in the GUI.
        const lastTabs = Array.from(document.querySelectorAll('.footer.rows2, .image.largeImg'));
        const requiresView = matchMedia(`${smallerScreen.media}, (max-height: 845px)`);
        const addGuiEventListeners = () => {
            for (const e of document.querySelectorAll('.gui .item:not(.fields)'))
                e.onclick = () => {
                    if (lastTabs.includes(e) || requiresView.matches) {
                        if (!reverseColumns || !smallerScreen.matches)
                            e.scrollIntoView({ behavior: 'smooth', block: "center" });
                        else if (e.nextElementSibling.classList.contains('edit') && e.classList.contains('active'))
                            // e.nextElementSibling.scrollIntoView({ behavior: 'smooth', block: "end" });
                            e.parentNode.scrollTop = e.offsetTop;
                    }
                };

            for (const e of document.querySelectorAll('.addField'))
                e.onclick = () => {
                    const guiEmbed = e.closest('.guiEmbed');
                    const indexOfGuiEmbed = Array.from(gui.querySelectorAll('.guiEmbed')).indexOf(guiEmbed);
                    if (indexOfGuiEmbed === -1) return error('Could not find the embed to add the field to.');

                    const fieldsObj = (jsonObject.embeds[indexOfGuiEmbed] ??= {}).fields ??= [];
                    if (fieldsObj.length >= 25) return error('Cannot have more than 25 fields');
                    fieldsObj.push({ name: "Field name", value: "Field value", inline: false });

                    const newField = guiEmbed?.querySelector('.item.fields+.edit>.fields')?.appendChild(fieldFragment.firstChild.cloneNode(true));

                    buildEmbed();
                    addGuiEventListeners();

                    newField.scrollIntoView({ behavior: "smooth", block: "center" });
                    if (!smallerScreen.matches) {
                        const firstFieldInput = newField.querySelector('.designerFieldName input');

                        firstFieldInput?.setSelectionRange(firstFieldInput.value.length, firstFieldInput.value.length);
                        firstFieldInput?.focus();
                    }
                };

            for (const e of document.querySelectorAll('.fields .field .removeBtn'))
                e.onclick = () => {
                    const embedIndex = guiEmbedIndex(e);
                    const fieldIndex = Array.from(e.closest('.fields').children).indexOf(e.closest('.field'));

                    if (jsonObject.embeds[embedIndex]?.fields[fieldIndex] === -1)
                        return error('Failed to find the index of the field to remove.');

                    jsonObject.embeds[embedIndex].fields.splice(fieldIndex, 1);

                    buildEmbed();
                    e.closest('.field').remove();
                };

            for (const e of gui.querySelectorAll('textarea, input'))
                e.oninput = el => {
                    const value = el.target.value;
                    const index = guiEmbedIndex(el.target);
                    const field = el.target.closest('.field');
                    const fields = field?.closest('.fields');
                    const embedObj = jsonObject.embeds[index] ??= {};

                    if (field) {
                        console.log(field)
                        const fieldIndex = Array.from(fields.children).indexOf(field);
                        const jsonField = embedObj.fields[fieldIndex];
                        const embedFields = document.querySelectorAll('.container>.embed')[index]?.querySelector('.embedFields');

                        if (jsonField) {
                            if (el.target.type === 'text') jsonField.name = value;
                            else if (el.target.type === 'textarea') jsonField.value = value;
                            else jsonField.inline = el.target.checked;
                            createEmbedFields(embedObj.fields, embedFields);
                        }
                    } else {
                        switch (el.target.classList?.[0]) {
                            case 'editContent':
                                jsonObject.content = value;
                                buildEmbed({ only: 'content' });
                                break;
                            case 'editTitle':
                                embedObj.title = value;
                                const guiEmbedName = el.target.closest('.guiEmbed')?.previousElementSibling;
                                if (guiEmbedName?.classList.contains('guiEmbedName'))
                                    guiEmbedName.querySelector('.text').innerHTML = `${guiEmbedName.innerText.split(':')[0]}${value ? `: <span>${value}</span>` : ''}`;
                                buildEmbed({ only: 'embedTitle', index: guiEmbedIndex(el.target) });
                                break;
                            case 'editAuthorName':
                                embedObj.author ??= {}, embedObj.author.name = value;
                                buildEmbed({ only: 'embedAuthorName', index: guiEmbedIndex(el.target) });
                                break;
                            case 'editAuthorLink': embedObj.author ??= {}, embedObj.author.icon_url = value;
                                imgSrc(el.target.previousElementSibling, value);
                                buildEmbed({ only: 'embedAuthorLink', index: guiEmbedIndex(el.target) });
                                break;
                            case 'editDescription': embedObj.description = value;
                                buildEmbed({ only: 'embedDescription', index: guiEmbedIndex(el.target) });
                                break;
                            case 'editThumbnailLink':
                                embedObj.thumbnail ??= {}, embedObj.thumbnail.url = value;
                                imgSrc(el.target.closest('.editIcon').querySelector('.imgParent'), value);
                                buildEmbed({ only: 'embedThumbnail', index: guiEmbedIndex(el.target) });
                                break;
                            case 'editImageLink':
                                embedObj.image ??= {}, embedObj.image.url = value;
                                imgSrc(el.target.closest('.editIcon').querySelector('.imgParent'), value);
                                buildEmbed({ only: 'embedImageLink', index: guiEmbedIndex(el.target) });
                                break;
                            case 'editFooterText':
                                embedObj.footer ??= {}, embedObj.footer.text = value;
                                buildEmbed({ only: 'embedFooterText', index: guiEmbedIndex(el.target) });
                                break;
                            case 'editFooterLink':
                                embedObj.footer ??= {}, embedObj.footer.icon_url = value;
                                imgSrc(el.target.previousElementSibling, value);
                                buildEmbed({ only: 'embedFooterLink', index: guiEmbedIndex(el.target) });
                                break;
                            case 'embedFooterTimestamp':
                                const date = new Date(value);
                                if (isNaN(date.getTime())) return error('Invalid date');

                                embedObj.timestamp = date;
                                el.target.parentElement.querySelector('svg>text').textContent = (date.getDate() + '').padStart(2, 0);
                                buildEmbed({ only: 'embedFooterTimestamp', index: guiEmbedIndex(el.target) });
                                break;
                        }

                        // Find and filter out any empty objects ({}) in the embeds array as Discord doesn't like them.
                        const nonEmptyEmbedObjects = json.embeds?.filter(o => 0 in Object.keys(o));
                        if (nonEmptyEmbedObjects?.length)
                            json.embeds = nonEmptyEmbedObjects;
                    }

                    // Display embed elements hidden due to not having content. '.msgEmbed>.container' is embed container.
                    document.querySelectorAll('.msgEmbed>.container')[guiEmbedIndex(el.target)]?.querySelector('.emptyEmbed')?.classList.remove('emptyEmbed');
                }

            const uploadError = (message, browse, sleepTime) => {
                browse.classList.remove('loading');
                browse.classList.add('error');

                const p = browse.parentElement.querySelector('.browse.error>p')
                p.dataset.error = message;

                setTimeout(() => {
                    browse.classList.remove('error');
                    delete p.dataset.error;
                }, sleepTime ?? 7000);
            }

            for (const browse of document.querySelectorAll('.browse'))
                browse.onclick = e => {
                    const formData = new FormData();
                    const fileInput = createElement({ 'input': { type: 'file', accept: 'image/*' } });
                    const edit = browse.closest('.edit');
                    const expiration = 7 * 24 * 60 * 60;

                    fileInput.onchange = el => {
                        if (el.target.files[0].size > 32 * 1024 * 1024)
                            return uploadError('File is too large. Maximum size is 32 MB.', browse, 5000);

                        formData.append("expiration", expiration); // Expire after 7 days. Discord caches files.
                        formData.append("key", options.uploadKey || "93385e22b0619db73a5525140b13491c"); // Add your own key through the uploadKey option.
                        formData.append("image", el.target.files[0]);
                        // formData.append("name", ""); // Uses original file name if no "name" is not specified.

                        browse.classList.add('loading');

                        fetch('https://api.imgbb.com/1/upload', { method: 'POST', body: formData })
                            .then(res => res.json())
                            .then(res => {
                                browse.classList.remove('loading');
                                if (!res.success) {
                                    console.log('Upload failed:', res.data?.error || res.error?.message || res);
                                    return uploadError(res.data?.error || res.error?.message || "Request failed. (Check dev-console)", browse);
                                }

                                imgSrc(edit.querySelector('.editIcon > .imgParent'), res.data.url);
                                const linkInput = edit.querySelector('input[type=text]');
                                const textInput = edit.querySelector('input[class$=Name], input[class$=Text]');

                                linkInput.value = res.data.url;
                                // focus on the next empty input if the field requires a name or text to display eg. footer or author.
                                !textInput?.value && textInput?.focus();

                                console.info(`${res.data.url} will be deleted in ${expiration / 60 / 60} hours. To delete it now, visit ${res.data.delete_url} and scroll down to find the delete button.`);

                                linkInput.dispatchEvent(new Event('input'));
                            }).catch(err => {
                                browse.classList.remove('loading');
                                error(`Request failed with error: ${err}`)
                            })
                    }

                    fileInput.click();
                }

            if (multiEmbeds) {
                for (const e of document.querySelectorAll('.guiEmbed'))
                    e.onclick = () => {
                        const guiEmbed = e.closest('.guiEmbed');
                        const indexOfGuiEmbed = Array.from(gui.querySelectorAll('.guiEmbed')).indexOf(guiEmbed);
                        if (indexOfGuiEmbed === -1) return error('Could not find the embed to add the field to.');

                        changeLastActiveGuiEmbed(indexOfGuiEmbed);
                    };


                if (!jsonObject.embeds[lastActiveGuiEmbedIndex])
                    changeLastActiveGuiEmbed(
                        jsonObject.embeds[lastActiveGuiEmbedIndex - 1] ?
                            lastActiveGuiEmbedIndex - 1 :
                            jsonObject.embeds.length ? 0 : -1
                    );
            } else {
                changeLastActiveGuiEmbed(-1);
            }
        }

        addGuiEventListeners();

        let activeGuiEmbed;

        if (opts?.guiEmbedIndex) {
            activeGuiEmbed = Array.from(document.querySelectorAll('.gui .item.guiEmbedName'))[opts.guiEmbedIndex];
            activeGuiEmbed?.classList.add('active');
            activeGuiEmbed = activeGuiEmbed?.nextElementSibling;
        }


        if (opts?.activateClassNames)
            for (const cName of opts.activateClassNames)
                for (const e of document.getElementsByClassName(cName))
                    e.classList.add('active');

        else if (opts?.guiTabs) {
            const tabs = opts.guiTabs.split?.(/, */) || opts.guiTabs;
            const bottomKeys = ['footer', 'image'];
            const topKeys = ['author', 'content'];


            // Deactivate the default activated GUI fields
            for (const e of gui.querySelectorAll('.item:not(.guiEmbedName).active'))
                e.classList.remove('active');

            // Activate wanted GUI fields
            for (const e of document.querySelectorAll(`.${tabs.join(', .')}`))
                e.classList.add('active');

            // Autoscroll GUI to the bottom if necessary.
            if (!tabs.some(item => topKeys.includes(item)) && tabs.some(item => bottomKeys.includes(item))) {
                const gui2 = document.querySelector('.top .gui');
                gui2.scrollTo({ top: gui2.scrollHeight });
            }
        }

        else if (opts?.activate)
            for (const clss of Array.from(opts.activate).map(el => el.className).map(clss => '.' + clss.split(' ').slice(0, 2).join('.')))
                for (const e of document.querySelectorAll(clss))
                    e.classList.add('active');

        else for (const clss of document.querySelectorAll('.item.author, .item.description'))
            clss.classList.add('active');
    }

    buildGui(jsonObject, { guiTabs });
    gui.classList.remove('hidden');

    fields = gui.querySelector('.fields ~ .edit .fields');

    // Renders embed and message content.
    buildEmbed = ({ jsonData, only, index = 0 } = {}) => {
        if (jsonData) json = jsonData;
        if (!jsonObject.embeds?.length) document.body.classList.add('emptyEmbed');

        try {
            // If there's no message content, hide the message content HTML element.
            if (!jsonObject.content) document.body.classList.add('emptyContent');
            else {
                // Update embed content in render
                embedContent.innerHTML = markup(encodeHTML(jsonObject.content), { replaceEmojis: true });
                document.body.classList.remove('emptyContent');
            }

            const embed = document.querySelectorAll('.container>.embed')[index];
            const embedObj = jsonObject.embeds[index];

            if (only && (!embed || !embedObj)) return buildEmbed();

            switch (only) {
                // If only updating the message content and nothing else, return here.
                case 'content': return externalParsing({ element: embedContent });
                case 'embedTitle':
                    const embedTitle = embed?.querySelector('.embedTitle');
                    if (!embedTitle) return buildEmbed();
                    if (!embedObj.title) hide(embedTitle);
                    else display(embedTitle, markup(`${embedObj.url ? '<a class="anchor" target="_blank" href="' + encodeHTML(url(embedObj.url)) + '">' + encodeHTML(embedObj.title) + '</a>' : encodeHTML(embedObj.title)}`, { replaceEmojis: true, inlineBlock: true }));

                    return externalParsing({ element: embedTitle });
                case 'embedAuthorName':
                case 'embedAuthorLink':
                    const embedAuthor = embed?.querySelector('.embedAuthor');
                    if (!embedAuthor) return buildEmbed();
                    if (!embedObj.author?.name) hide(embedAuthor);
                    else display(embedAuthor, `
                        ${embedObj.author.icon_url ? '<img class="embedAuthorIcon embedAuthorLink" src="' + encodeHTML(url(embedObj.author.icon_url)) + '">' : ''}
                        ${embedObj.author.url ? '<a class="embedAuthorNameLink embedLink embedAuthorName" href="' + encodeHTML(url(embedObj.author.url)) + '" target="_blank">' + encodeHTML(embedObj.author.name) + '</a>' : '<span class="embedAuthorName">' + encodeHTML(embedObj.author.name) + '</span>'}`, 'flex');

                    return externalParsing({ element: embedAuthor });
                case 'embedDescription':
                    const embedDescription = embed?.querySelector('.embedDescription');
                    if (!embedDescription) return buildEmbed();
                    if (!embedObj.description) hide(embedDescription);
                    else display(embedDescription, markup(encodeHTML(embedObj.description), { inEmbed: true, replaceEmojis: true }));

                    return externalParsing({ element: embedDescription });
                case 'embedThumbnail':
                    const embedThumbnailLink = embed?.querySelector('.embedThumbnailLink');
                    if (!embedThumbnailLink) return buildEmbed();
                    const pre = embed.querySelector('.embedGrid .markup pre');
                    if (embedObj.thumbnail?.url) {
                        embedThumbnailLink.src = embedObj.thumbnail.url;
                        embedThumbnailLink.parentElement.style.display = 'block';
                        if (pre) pre.style.maxWidth = '90%';
                    } else {
                        hide(embedThumbnailLink.parentElement);
                        pre?.style.removeProperty('max-width');
                    }

                    return afterBuilding();
                case 'embedImage':
                    const embedImageLink = embed?.querySelector('.embedImageLink');
                    if (!embedImageLink) return buildEmbed();
                    if (!embedObj.image?.url) hide(embedImageLink.parentElement);
                    else embedImageLink.src = embedObj.image.url,
                        embedImageLink.parentElement.style.display = 'block';

                    return afterBuilding();
                case 'embedFooterText':
                case 'embedFooterLink':
                case 'embedFooterTimestamp':
                    const embedFooter = embed?.querySelector('.embedFooter');
                    if (!embedFooter) return buildEmbed();
                    if (!embedObj.footer?.text) hide(embedFooter);
                    else display(embedFooter, `
                        ${embedObj.footer.icon_url ? '<img class="embedFooterIcon embedFooterLink" src="' + encodeHTML(url(embedObj.footer.icon_url)) + '">' : ''}<span class="embedFooterText">
                        ${encodeHTML(embedObj.footer.text)}
                        ${embedObj.timestamp ? '<span class="embedFooterSeparator">•</span>' + encodeHTML(timestamp(embedObj.timestamp)) : ''}</span></div>`, 'flex');

                    return externalParsing({ element: embedFooter });
            }

            if (multiEmbeds) embedCont.innerHTML = '';

            for (const embedObj of jsonObject.embeds) {
                if (!allGood(embedObj)) continue;
                if (!multiEmbeds) embedCont.innerHTML = '';

                validationError = false;

                const embedElement = embedCont.appendChild(embedFragment.firstChild.cloneNode(true));
                const embedGrid = embedElement.querySelector('.embedGrid');
                const msgEmbed = embedElement.querySelector('.msgEmbed');
                const embedTitle = embedElement.querySelector('.embedTitle');
                const embedDescription = embedElement.querySelector('.embedDescription');
                const embedAuthor = embedElement.querySelector('.embedAuthor');
                const embedFooter = embedElement.querySelector('.embedFooter');
                const embedImage = embedElement.querySelector('.embedImage > img');
                const embedThumbnail = embedElement.querySelector('.embedThumbnail > img');
                const embedFields = embedElement.querySelector('.embedFields');

                if (embedObj.title) display(embedTitle, markup(`${embedObj.url ? '<a class="anchor" target="_blank" href="' + encodeHTML(url(embedObj.url)) + '">' + encodeHTML(embedObj.title) + '</a>' : encodeHTML(embedObj.title)}`, { replaceEmojis: true, inlineBlock: true }));
                else hide(embedTitle);

                if (embedObj.description) display(embedDescription, markup(encodeHTML(embedObj.description), { inEmbed: true, replaceEmojis: true }));
                else hide(embedDescription);

                if (embedObj.color) embedGrid.closest('.embed').style.borderColor = (typeof embedObj.color === 'number' ? '#' + embedObj.color.toString(16).padStart(6, "0") : embedObj.color);
                else embedGrid.closest('.embed').style.removeProperty('border-color');

                if (embedObj.author?.name) display(embedAuthor, `
                    ${embedObj.author.icon_url ? '<img class="embedAuthorIcon embedAuthorLink" src="' + encodeHTML(url(embedObj.author.icon_url)) + '">' : ''}
                    ${embedObj.author.url ? '<a class="embedAuthorNameLink embedLink embedAuthorName" href="' + encodeHTML(url(embedObj.author.url)) + '" target="_blank">' + encodeHTML(embedObj.author.name) + '</a>' : '<span class="embedAuthorName">' + encodeHTML(embedObj.author.name) + '</span>'}`, 'flex');
                else hide(embedAuthor);

                const pre = embedGrid.querySelector('.markup pre');
                if (embedObj.thumbnail?.url) {
                    embedThumbnail.src = embedObj.thumbnail.url;
                    embedThumbnail.parentElement.style.display = 'block';
                    if (pre) pre.style.maxWidth = '90%';
                } else {
                    hide(embedThumbnail.parentElement);
                    if (pre) pre.style.removeProperty('max-width');
                }

                if (embedObj.image?.url)
                    embedImage.src = embedObj.image.url,
                        embedImage.parentElement.style.display = 'block';
                else hide(embedImage.parentElement);

                if (embedObj.footer?.text) display(embedFooter, `
                    ${embedObj.footer.icon_url ? '<img class="embedFooterIcon embedFooterLink" src="' + encodeHTML(url(embedObj.footer.icon_url)) + '">' : ''}<span class="embedFooterText">
                        ${encodeHTML(embedObj.footer.text)}
                    ${embedObj.timestamp ? '<span class="embedFooterSeparator">•</span>' + encodeHTML(timestamp(embedObj.timestamp)) : ''}</span></div>`, 'flex');
                else if (embedObj.timestamp) display(embedFooter, `<span class="embedFooterText">${encodeHTML(timestamp(embedObj.timestamp))}</span></div>`, 'flex');
                else hide(embedFooter);

                if (embedObj.fields) createEmbedFields(embedObj.fields, embedFields);
                else hide(embedFields);

                document.body.classList.remove('emptyEmbed');
                externalParsing();

                if (embedElement.innerText.trim() || embedElement.querySelector('.embedGrid > [style*=display] img'))
                    embedElement.classList.remove('emptyEmbed');
                else
                    embedElement.classList.add('emptyEmbed');
            }

            // Make sure that the embed has no text or any visible images such as custom emojis before hiding.
            if (!multiEmbeds && !embedCont.innerText.trim() && !embedCont.querySelector('.embedGrid > [style*=display] img'))
                document.body.classList.add('emptyEmbed');

            afterBuilding()
        } catch (e) {
            console.error(e);
            error(e);
        }
    }

    editor.on('change', editor => {
        // If the editor value is not set by the user, return.
        if (JSON.stringify(json, null, 4) === editor.getValue()) return;

        try {
            // Autofill when " is typed on new line
            const line = editor.getCursor().line;
            const text = editor.getLine(line)

            if (text.trim() === '"') {
                editor.replaceRange(text.trim() + ':', { line, ch: line.length });
                editor.setCursor(line, text.length)
            }

            json = JSON.parse(editor.getValue());
            const dataKeys = Object.keys(json);

            if (dataKeys.length && !allJsonKeys.some(key => dataKeys.includes(key))) {
                const usedKeys = dataKeys.filter(key => !allJsonKeys.includes(key));
                if (usedKeys.length > 2)
                    return error(`'${usedKeys[0] + "', '" + usedKeys.slice(1, usedKeys.length - 1).join("', '")}', and '${usedKeys[usedKeys.length - 1]}' are invalid keys.`);
                return error(`'${usedKeys.length == 2 ? usedKeys[0] + "' and '" + usedKeys[usedKeys.length - 1] + "' are invalid keys." : usedKeys[0] + "' is an invalid key."}`);
            }

            buildEmbed();

        } catch (e) {
            if (editor.getValue()) return;
            document.body.classList.add('emptyEmbed');
            embedContent.innerHTML = '';
        }
    });

    const picker = new CP(document.querySelector('.picker'), state = { parent: document.querySelector('.cTop') });

    picker.fire?.('change', toRGB('#41f097'));

    const colors = document.querySelector('.colors');
    const hexInput = colors?.querySelector('.hex>div input');

    let typingHex = true, exit = false;

    removePicker = () => {
        if (exit) return exit = false;
        if (typingHex) picker.enter();
        else {
            typingHex = false, exit = true;
            colors.classList.remove('picking');
            picker.exit();
        }
    }

    document.querySelector('.colBack')?.addEventListener('click', () => {
        picker.self.remove();
        typingHex = false;
        removePicker();
    })

    picker.on?.('exit', removePicker);
    picker.on?.('enter', () => {
        const embedIndex = multiEmbeds && lastActiveGuiEmbedIndex !== -1 ? lastActiveGuiEmbedIndex : 0;
        if (jsonObject?.embeds[embedIndex]?.color) {
            hexInput.value = jsonObject.embeds[embedIndex].color.toString(16).padStart(6, '0');
            document.querySelector('.hex.incorrect')?.classList.remove('incorrect');
        }
        colors.classList.add('picking')
    })

    document.querySelectorAll('.color').forEach(e => e.addEventListener('click', el => {
        const embedIndex = multiEmbeds && lastActiveGuiEmbedIndex !== -1 ? lastActiveGuiEmbedIndex : 0;
        const embed = document.querySelectorAll('.msgEmbed .container>.embed')[embedIndex];
        const embedObj = jsonObject.embeds[embedIndex] ??= {};
        const color = el.target.closest('.color');

        embedObj.color = toRGB(color.style.backgroundColor, false, true);
        embed && (embed.style.borderColor = color.style.backgroundColor);
        picker.source.style.removeProperty('background');
    }))

    hexInput?.addEventListener('focus', () => typingHex = true);
    setTimeout(() => {
        picker.on?.('change', function (r, g, b, a) {
            const embedIndex = multiEmbeds && lastActiveGuiEmbedIndex !== -1 ? lastActiveGuiEmbedIndex : 0;
            const embed = document.querySelectorAll('.msgEmbed .container>.embed')[embedIndex];
            const embedObj = jsonObject.embeds[embedIndex];

            picker.source.style.background = this.color(r, g, b);
            embedObj.color = parseInt(this.color(r, g, b).slice(1), 16);
            embed.style.borderColor = this.color(r, g, b);
            hexInput.value = embedObj.color.toString(16).padStart(6, '0');
        })
    }, 1000)

    document.querySelector('.timeText').innerText = timestamp();

    for (const block of document.querySelectorAll('.markup pre > code'))
        hljs.highlightBlock(block);

    document.querySelector('.opt.gui').addEventListener('click', () => {
        if (lastGuiJson && lastGuiJson !== JSON.stringify(json, null, 4))
            buildGui();

        lastGuiJson = false
        activeFields = null;

        document.body.classList.add('gui');
        if (pickInGuiMode) {
            pickInGuiMode = false;
            togglePicker();
        }
    })

    document.querySelector('.opt.json').addEventListener('click', () => {
        const emptyEmbedIndex = indexOfEmptyGuiEmbed(false);
        if (emptyEmbedIndex !== -1)
            // Clicked GUI tab while a blank embed is added from GUI.
            return error(gui.querySelectorAll('.item.guiEmbedName')[emptyEmbedIndex].innerText.split(':')[0] + ' should not be empty.', '3s');

        const jsonStr = JSON.stringify(json, null, 4);
        lastGuiJson = jsonStr;

        document.body.classList.remove('gui');
        editor.setValue(jsonStr === '{}' ? '{\n\t\n}' : jsonStr);
        editor.refresh();
        editor.focus();

        activeFields = document.querySelectorAll('.gui > .item.active');
        if (document.querySelector('section.side1.low'))
            togglePicker(true);
    })

    document.querySelector('.clear').addEventListener('click', () => {
        json = {};

        picker.source.style.removeProperty('background');
        document.querySelector('.msgEmbed .container>.embed')?.remove();

        buildEmbed();
        buildGui();

        const jsonStr = JSON.stringify(json, null, 4);
        editor.setValue(jsonStr === '{}' ? '{\n\t\n}' : jsonStr);

        for (const e of document.querySelectorAll('.gui .item'))
            e.classList.add('active');

        if (!smallerScreen.matches)
            content.focus();
    })

    document.querySelector('.top-btn.menu')?.addEventListener('click', e => {
        if (e.target.closest('.item.dataLink')) {
            const data = encodeJson(json, true).replace(/(?<!data=[^=]+|=)=(&|$)/g, x => x === '=' ? '' : '&');
            if (!window.chrome)
                // With long text inside a 'prompt' on Chromium based browsers, some text will be trimmed off and replaced with '...'.
                return prompt('Here\'s the current URL with base64 embed data:', data);

            // So, for the Chromium users, we copy to clipboard instead of showing a prompt.
            try {
                // Clipboard API might only work on HTTPS protocol.
                navigator.clipboard.writeText(data);
            } catch {
                const input = document.body.appendChild(document.createElement('input'));
                input.value = data;
                input.select();
                document.setSelectionRange(0, 50000);
                document.execCommand('copy');
                document.body.removeChild(input);
            }

            return alert('Copied to clipboard.');
        }

        if (e.target.closest('.item.download'))
            return createElement({ a: { download: 'embed' + '.json', href: 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(json, null, 4)) } }).click();

        const input = e.target.closest('.item')?.querySelector('input');
        if (input) input.checked = !input.checked;

        if (e.target.closest('.item.auto')) {
            autoUpdateURL = document.body.classList.toggle('autoUpdateURL');
            if (autoUpdateURL) localStorage.setItem('autoUpdateURL', true);
            else localStorage.removeItem('autoUpdateURL');
            urlOptions({ set: ['data', encodeJson(json)] });
        } else if (e.target.closest('.item.reverse')) {
            reverse(reverseColumns);
            reverseColumns = !reverseColumns;
            toggleStored('reverseColumns');
        } else if (e.target.closest('.item.noUser')) {
            if (options.avatar) document.querySelector('img.avatar').src = options.avatar;

            const noUser = document.body.classList.toggle('no-user');
            if (autoParams) noUser ? urlOptions({ set: ['nouser', ''] }) : urlOptions({ remove: 'nouser' });
            toggleStored('noUser');
        } else if (e.target.closest('.item.auto-params')) {
            if (input.checked) localStorage.setItem('autoParams', true);
            else localStorage.removeItem('autoParams');
            autoParams = input.checked;
        } else if (e.target.closest('.toggles>.item')) {
            const win = input.closest('.item').classList[2];

            if (input.checked) {
                document.body.classList.remove(`no-${win}`);
                localStorage.removeItem(`hide${win}`);
            } else {
                document.body.classList.add(`no-${win}`);
                localStorage.setItem(`hide${win}`, true);
            }
        } else if (e.target.closest('.item.multi') && !noMultiEmbedsOption) {
            multiEmbeds = !document.body.classList.toggle('single');
            activeFields = document.querySelectorAll('.gui > .item.active');

            if (autoParams) !multiEmbeds ? urlOptions({ set: ['single', ''] }) : urlOptions({ remove: 'single' });
            if (multiEmbeds) localStorage.setItem('multiEmbeds', true);
            else {
                localStorage.removeItem('multiEmbeds');
                jsonObject.embeds = [jsonObject.embeds?.[0] || {}];
            }

            buildGui();
            buildEmbed();
            editor.setValue(JSON.stringify(json, null, 4));
        }

        e.target.closest('.top-btn')?.classList.toggle('active')
    })

    document.querySelectorAll('.img').forEach(e => {
        if (e.nextElementSibling?.classList.contains('spinner-container'))
            e.addEventListener('error', el => {
                el.target.style.removeProperty('display');
                el.target.nextElementSibling.style.display = 'block';
            })
    })

    let pickInGuiMode = false;
    togglePicker = pickLater => {
        colors.classList.toggle('display');
        document.querySelector('.side1').classList.toggle('low');
        if (pickLater) pickInGuiMode = true;
    };

    document.querySelector('.pickerToggle').addEventListener('click', () => togglePicker());
    buildEmbed();

    document.body.addEventListener('click', e => {
        if (e.target.classList.contains('low') || (e.target.classList.contains('top') && colors.classList.contains('display')))
            togglePicker();
    })

    // #0070ff, #5865f2
    document.querySelector('.colors .hex>div')?.addEventListener('input', e => {
        let inputValue = e.target.value;

        if (inputValue.startsWith('#'))
            e.target.value = inputValue.slice(1), inputValue = e.target.value;
        if (inputValue.length !== 6 || !/^[a-zA-Z0-9]{6}$/g.test(inputValue))
            return e.target.closest('.hex').classList.add('incorrect');

        e.target.closest('.hex').classList.remove('incorrect');

        const embedIndex = multiEmbeds && lastActiveGuiEmbedIndex !== -1 ? lastActiveGuiEmbedIndex : 0;
        jsonObject.embeds[embedIndex].color = parseInt(inputValue, 16);
        picker.fire?.('change', toRGB(inputValue));

        buildEmbed();
    })

    if (onlyEmbed) document.querySelector('.side1')?.remove();

    const menuMore = document.querySelector('.item.section .inner.more');
    const menuSource = menuMore?.querySelector('.source');

    if (!sourceOption) menuSource.remove();
    if (menuMore.childElementCount < 2) menuMore?.classList.add('invisible');
    if (menuMore.parentElement.childElementCount < 1) menuMore?.parentElement.classList.add('invisible');

    document.querySelector('.top-btn.copy').addEventListener('click', e => {
        const mark = e.target.closest('.top-btn.copy').querySelector('.mark'),
            jsonData = JSON.stringify(json, null, 4),
            next = () => {
                mark?.classList.remove('hidden');
                mark?.previousElementSibling?.classList.add('hidden');

                setTimeout(() => {
                    mark?.classList.add('hidden');
                    mark?.previousElementSibling?.classList.remove('hidden');
                }, 1500);
            }

        if (!navigator.clipboard?.writeText(jsonData).then(next).catch(err => console.log('Could not copy to clipboard: ' + err.message))) {
            const textarea = document.body.appendChild(document.createElement('textarea'));

            textarea.value = jsonData;
            textarea.select();
            textarea.setSelectionRange(0, 50000);
            document.execCommand('copy');
            document.body.removeChild(textarea);
            next();
        }
    });
});

// Don't assign to 'jsonObject', assign to 'json' instead.
// 'jsonObject' is used to store the final json object and used internally.
// Below is the getter and setter for 'json' which formats the value properly into and out of 'jsonObject'.
Object.defineProperty(window, 'json', {
    configurable: true,
    // Getter to format 'jsonObject' properly depending on options and other factors
    // eg. using 'embeds' or 'embed' in output depending on 'multiEmbeds' option.
    get() {
        const json = {};

        if (jsonObject.content)
            json.content = jsonObject.content;

        // If 'jsonObject.embeds' array is set and has content. Empty braces ({}) will be filtered as not content.
        if (jsonObject.embeds?.length)
            if (multiEmbeds) json.embeds = jsonObject.embeds.map(cleanEmbed);
            else json.embed = cleanEmbed(jsonObject.embeds[0]);

        return json;
    },

    // Setter for 'json' which formats the value properly into 'jsonObject'.
    set(val) {
        // Filter out items which are not objects and not empty objects.
        const embedObjects = val.embeds?.filter(j => j.constructor === Object && 0 in Object.keys(j));
        // Convert 'embed' to 'embeds' and delete 'embed' or validate and use 'embeds' if provided.
        const embeds = val.embed ? [val.embed] : embedObjects?.length ? embedObjects : []
        // Convert objects used as values to string and trim whitespace.
        const content = val.content?.toString().trim();

        jsonObject = {
            ...(content && { content }),
            embeds: embeds.map(cleanEmbed),
        };

        buildEmbed();
        buildGui();
    },
});

// Props used to validate embed properties.
window.embedObjectsProps ??= {
    author: ["name", "url", "icon_url",],
    thumbnail: ["url", "proxy_url", "height", "width",],
    image: ["url", "proxy_url", "height", "width",],
    fields: { items: ["name", "value", "inline",], },
    footer: ["text", "icon_url",],
}

function cleanEmbed(obj, recursing = false) {
    if (!recursing)
        // Remove all invalid properties from embed object.
        for (const key in obj)
            if (!embedKeys.includes(key))
                delete obj[key];
            else if (obj[key].constructor === Object) // Value is an object. eg. 'author'
                // Remove items that are not in the props of the current key.
                for (const item in obj[key])
                    !embedObjectsProps[key].includes(item) && delete obj[key][item];

            else if (obj[key].constructor === Array) // Value is an array. eg. 'fields'
                // Remove items that are not in the props of the current key.
                for (const item of obj[key])
                    for (const i in item)
                        !embedObjectsProps[key].items.includes(i) && delete item[i];

    // Remove empty properties from embed object.
    for (const [key, val] of Object.entries(obj))
        if (val === undefined || val.trim?.() === "")
            // Remove the key if value is empty
            delete obj[key];
        else if (val.constructor === Object)
            // Remove object (val) if it has no keys or recursively remove empty keys from objects.
            (!Object.keys(val).length && delete obj[key]) || (obj[key] = cleanEmbed(val, true));
        else if (val.constructor === Array)
            // Remove array (val) if it has no keys or recursively remove empty keys from objects in array.
            !val.length && delete obj[key] || (obj[key] = val.map(k => cleanEmbed(k, true)));
        else
            // If object isn't a string, boolean, number, array or object, convert it to string.
            if (!['string', 'boolean', 'number'].includes(typeof val))
                obj[key] = val.toString();

    return obj;
}
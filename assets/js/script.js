
// Want to use or contribute to this? https://github.com/Glitchii/embedbuilder
// If you found an issue, please report it, make a P.R, or use the discussion page. Thanks

options = window.options || {};
inIframe = window.inIframe || top !== self;
currentURL = () => new URL(inIframe ? /(https?:\/\/(?:[\d\w]+\.)?[\d\w\.]+(?::\d+)?)/g.exec(document.referrer)?.[0] || location.href : location.href);

var params = currentURL().searchParams,
    hasParam = param => params.get(param) !== null,
    dataSpecified = options.dataSpecified || params.get('data'),
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
    autoParams = localStorage.getItem('autoParams') || hasParam('autoparams') || options.autoParams,
    hideEditor = localStorage.getItem('hideeditor') || hasParam('hideeditor') || options.hideEditor,
    hidePreview = localStorage.getItem('hidepreview') || hasParam('hidepreview') || options.hidePreview,
    hideMenu = localStorage.getItem('hideMenu') || hasParam('hidemenu') || options.hideMenu,
    activeFields, colNum = 1, num = 0, validationError,
    toggleStored = item => {
        const found = localStorage.getItem(item);
        if (!found) return localStorage.setItem(item, true);

        localStorage.removeItem(item);
        return found;
    },
    jsonToBase64 = (jsonCode, withURL = false, redirect = false) => {
        data = btoa(escape((JSON.stringify(typeof jsonCode === 'object' ? jsonCode : json))));
        if (withURL) {
            const url = currentURL();
            url.searchParams.set('data', data);
            if (redirect) window.top.location.href = url;
            // Replace %3D ('=' url encoded) with '='
            data = url.href.replace(/data=\w+(?:%3D)+/g, 'data=' + data);
        }
        return data;
    },
    base64ToJson = data => {
        jsonData = unescape(atob(data || dataSpecified));
        if (typeof jsonData === 'string')
            jsonData = JSON.parse(jsonData);
        return jsonData;
    },
    toRGB = (hex, reversed, integer) => {
        if (reversed) return '#' + hex.match(/[\d]+/g).map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
        if (integer) return parseInt(hex.match(/[\d]+/g).map(x => parseInt(x).toString(16).padStart(2, '0')).join(''), 16);
        if (hex.includes(',')) return hex.match(/[\d]+/g);
        hex = hex.replace('#', '').match(/.{1,2}/g)
        return [parseInt(hex[0], 16), parseInt(hex[1], 16), parseInt(hex[2], 16), 1];
    },
    reverse = (reversed, callback) => {
        const side = document.querySelector(reversed ? '.side2' : '.side1');
        if (side.nextElementSibling) side.parentElement.insertBefore(side.nextElementSibling, side);
        else side.parentElement.insertBefore(side, side.parentElement.firstElementChild);

        const isReversed = document.body.classList.toggle('reversed');
        if (autoParams) isReversed ? urlOptions({ set: ['reverse', ''] }) : urlOptions({ remove: 'reverse' });
    },
    urlOptions = ({ remove, set }) => {
        const url = currentURL();
        if (remove) url.searchParams.delete(remove);
        if (set) url.searchParams.set(set[0], set[1]);
        try {
            history.replaceState(null, null, url.href.replace(/=&|=$/g, x => x === '=' ? '' : '&'));
        } catch (e) {
            // Most likely embeded in iframe
            console.message(`${e.name}: ${e.message}`, e);
            // if (e.name === 'SecurityError')
            //     window.top.location.href = href;
        }
    },
    mainKeys = ["author", "footer", "color", "thumbnail", "image", "fields", "title", "description", "url", "timestamp"],
    jsonKeys = ["embed", "content", ...mainKeys],
    json = window.json || {
        content: "You can~~not~~ do `this`.```py\nAnd this.\nprint('Hi')```\n*italics* or _italics_     __*underline italics*__\n**bold**     __**underline bold**__\n***bold italics***  __***underline bold italics***__\n__underline__     ~~Strikethrough~~",
        embed: {
            title: "Hello ~~people~~ world :wave:",
            description: "You can use [links](https://discord.com) or emojis :smile: 😎\n```\nAnd also code blocks\n```",
            color: 4321431,
            timestamp: new Date().toISOString(),
            url: "https://discord.com",
            author: {
                name: "Author name",
                url: "https://discord.com",
                icon_url: "https://unsplash.it/100"
            },
            thumbnail: {
                url: "https://unsplash.it/200"
            },
            image: {
                url: "https://unsplash.it/380/200"
            },
            footer: {
                text: "Footer text",
                icon_url: "https://unsplash.it/100"
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
    json = base64ToJson();

if (allowPlaceholders)
    allowPlaceholders = params.get('placeholders') === 'errors' ? 1 : 2;

addEventListener('DOMContentLoaded', () => {
    if (onlyEmbed)
        document.body.classList.add('only-embed');
    else {
        document.querySelector('.side1.noDisplay')?.classList.remove('noDisplay');
        if (useJsonEditor)
            document.body.classList.remove('gui');
    }
    if (noUser)
        document.body.classList.add('no-user');
    else {
        if (username) document.querySelector('.username').textContent = username;
        if (avatar) document.querySelector('.avatar').src = avatar;
        if (verified) document.querySelector('.msgEmbed > .contents').classList.add('verified');
    }
    if (reverseColumns || localStorage.getItem('reverseColumns'))
        reverse();
    if (autoUpdateURL)
        document.body.classList.add('autoUpdateURL');
    if (autoParams)
        document.querySelector('.auto-params > input').checked = true;
    if (inIframe)
        // Remove menu options that don't work in iframe.
        for (const e of document.querySelectorAll('.no-frame'))
            e.remove();
    if (hideMenu)
        document.querySelector('.top-btn.menu').classList.add('hidden');
    if (hideEditor) {
        document.body.classList.add('no-editor');
        document.querySelector('.toggle .toggles .editor input').checked = false;
    }
    if (hidePreview) {
        document.body.classList.add('no-preview');
        document.querySelector('.toggle .toggles .preview input').checked = false;
    }

    document.querySelectorAll('.clickable > img')
        .forEach(e => e.parentElement.addEventListener('mouseup', el => window.open(el.target.src)));

    const editorHolder = document.querySelector('.editorHolder'),
        guiParent = document.querySelector('.top'),
        embedContent = document.querySelector('.messageContent'),
        embedCont = document.querySelector('.messageContent + .container'),
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
            // Make tabs four spaces long instead of the default two.
            Tab: cm => cm.replaceSelection("    ", "end"),
            // Fill in indent spaces on a new line when enter (return) key is pressed.
            Enter: _ => {
                let cur = editor.getCursor(), end = editor.getLine(cur.line),
                    leadingSpaces = end.replace(/\S($|.)+/g, '') || '    \n', nextLine = editor.getLine(cur.line + 1);
                if ((nextLine === undefined || !nextLine.trim()) && !end.substr(cur.ch).trim())
                    editor.replaceRange('\n', { line: cur.line, ch: cur.ch });
                else
                    editor.replaceRange(`\n${end.endsWith('{') ? leadingSpaces + '    ' : leadingSpaces}`, {
                        line: cur.line,
                        ch: cur.ch
                    });
            },
        }
    });

    editor.focus();
    const notif = document.querySelector('.notification'),
        url = (url) => /^(https?:)?\/\//g.exec(url) ? url : '//' + url,
        makeShort = (txt, length, mediaWidth) => {
            if (mediaWidth && matchMedia(`(max-width:${mediaWidth}px)`).matches)
                return txt.length > (length - 3) ? txt.substring(0, length - 3) + '...' : txt;
            return txt;
        }, error = (msg, time) => {
            if (msg === false)
                // Hide error element
                return notif.animate({ opacity: '0', bottom: '-50px', offset: 1 }, { easing: 'ease', duration: 500 }).onfinish = () => notif.style.removeProperty('display');
            notif.innerHTML = msg;
            notif.style.display = 'block';
            time && setTimeout(() => notif.animate({ opacity: '0', bottom: '-50px', offset: 1 }, { easing: 'ease', duration: 500 })
                .onfinish = () => notif.style.removeProperty('display'), time);
            return false;
        }, allGood = e => {
            let invalid, err, str = JSON.stringify(e, null, 4), re = /("(?:icon_)?url": *")((?!\w+?:\/\/).+)"/g.exec(str);
            if (e.timestamp && new Date(e.timestamp).toString() === "Invalid Date") {
                if (allowPlaceholders === 2) return true;
                if (!allowPlaceholders)
                    invalid = true, err = 'Timestamp is invalid';
            } else if (re) { // If a URL is found without a protocol
                if (!/\w+:|\/\/|^\//g.exec(re[2]) && re[2].includes('.')) {
                    let activeInput = document.querySelector('input[class$="link" i]:focus')
                    if (activeInput && !allowPlaceholders) {
                        lastPos = activeInput.selectionStart + 7;
                        activeInput.value = `http://${re[2]}`;
                        update(JSON.parse(str.replace(re[0], `${re[1]}http://${re[2]}"`)));
                        activeInput.setSelectionRange(lastPos, lastPos)
                        return true;
                    }
                }
                if (allowPlaceholders !== 2)
                    invalid = true, err = (`URL should have a protocol. Did you mean <span class="inline full short">http://${makeShort(re[2], 30, 600).replace(' ', '')}</span>?`);
            }
            if (invalid) {
                validationError = true;
                return error(err, 5000);
            }
            return true;
        }, innerHTML = (element, html) => {
            // console.log(element, html);
            element.innerHTML = html;
            return element;
        }, markup = (txt, opts) => {
            if (opts.replaceEmojis)
                txt = txt.replace(/(?<!code(?: \w+=".+")?>[^>]+)(?<!\/[^\s"]+?):((?!\/)\w+):/g, (match, p) => p && emojis[p] ? emojis[p] : match);

            txt = txt
                /** Markdown */
                .replace(/&#60;:\w+:(\d{18})&#62;/g, '<img class="emoji" src="https://cdn.discordapp.com/emojis/$1.png"/>')
                .replace(/&#60;a:\w+:(\d{18})&#62;/g, '<img class="emoji" src="https://cdn.discordapp.com/emojis/$1.gif"/>')
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

            if (opts.inlineBlock)
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

            if (opts.inEmbed)
                txt = txt.replace(/\[([^\[\]]+)\]\((.+?)\)/g, `<a title="$1" target="_blank" class="anchor" href="$2">$1</a>`);

            return txt;
        },
        embed = document.querySelector('.embedGrid'),
        msgEmbed = document.querySelector('.msgEmbed'),
        embedTitle = document.querySelector('.embedTitle'),
        embedDescription = document.querySelector('.embedDescription'),
        embedAuthor = document.querySelector('.embedAuthor'),
        embedFooter = document.querySelector('.embedFooter'),
        embedImage = document.querySelector('.embedImage > img'),
        embedThumbnail = document.querySelector('.embedThumbnail > img'),
        embedFields = embed.querySelector('.embedFields'),
        smallerScreen = matchMedia('(max-width: 1015px)'),
        encodeHTML = str => str.replace(/[\u00A0-\u9999<>\&]/g, i => '&#' + i.charCodeAt(0) + ';'),
        tstamp = stringISO => {
            let date = stringISO ? new Date(stringISO) : new Date(),
                dateArray = date.toLocaleString('en-US', { hour: 'numeric', hour12: false, minute: 'numeric' }),
                today = new Date(),
                yesterday = new Date(new Date().setDate(today.getDate() - 1));
            return today.toDateString() === date.toDateString() ? `Today at ${dateArray}` :
                yesterday.toDateString() === date.toDateString() ? `Yesterday at ${dateArray}` :
                    `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
        }, display = (el, data, displayType) => {
            if (data) innerHTML(el, data);
            el.style.display = displayType || "unset";
        }, hide = el => el.style.removeProperty('display'),
        imgSrc = (elm, src, remove) => remove ? elm.style.removeProperty('content') : elm.style.content = `url(${src})`;
    buildGui = (object, opts) => {
        gui.innerHTML = `
            <div class="item content"><p class="ttle">Message content</p></div>
            <div class="edit">
                <textarea class="editContent" placeholder="Message content" maxlength="2000" autocomplete="off">${encodeHTML(object.content || '')}</textarea>
            </div>
            <div class="item author rows2"><p class="ttle">Author</p></div>
            <div class="edit">
                <div class="linkName">
                    <div class="editIcon">
                        <span class="imgParent" ${object.embed?.author?.icon_url ? 'style="content: url(' + encodeHTML(object.embed.author.icon_url) + ')"' : ''}></span>
                        <input class="editAuthorLink" type="text" value="${encodeHTML(object.embed?.author?.icon_url || '')}" placeholder="Icon URL" autocomplete="off"/>
                    </div>
                    <div class="editName">
                        <input class="editAuthorName" type="text" maxlength="256" value="${encodeHTML(object.embed?.author?.name || '')}" placeholder="Author name" autocomplete="off" />
                    </div>
                </div>
                <form method="post" enctype="multipart/form-data">
                    <input class="browserAuthorLink" type="file" name="file" id="file2" accept="image/png,image/gif,image/jpeg,image/webp" autocomplete="off" />
                    <label for="file2">
                        <div class="browse">
                            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" version="1.1" width="512" height="512" x="0" y="0" viewBox="0 0 64 64" xml:space="preserve">
                                <g>
                                    <path xmlns="http://www.w3.org/2000/svg" d="m23.414 21.414 6.586-6.586v29.172c0 1.104.896 2 2 2s2-.896 2-2v-29.172l6.586 6.586c.39.391.902.586 1.414.586s1.024-.195 1.414-.586c.781-.781.781-2.047 0-2.828l-10-10c-.78-.781-2.048-.781-2.828 0l-10 10c-.781.781-.781 2.047 0 2.828.78.781 2.048.781 2.828 0z" fill="#ffffff" data-original="#000000"></path>
                                    <path xmlns="http://www.w3.org/2000/svg" d="m50 40c-1.104 0-2 .896-2 2v8c0 1.103-.897 2-2 2h-28c-1.103 0-2-.897-2-2v-8c0-1.104-.896-2-2-2s-2 .896-2 2v8c0 3.309 2.691 6 6 6h28c3.309 0 6-2.691 6-6v-8c0-1.104-.896-2-2-2z" fill="#ffffff" data-original="#000000"></path>
                                </g>
                            </svg>
                            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 0 0" xml:space="preserve">
                                <circle fill="#fff" stroke="none" cx="6" cy="50" r="6">
                                    <animateTransform attributeName="transform" dur="1s" type="translate" values="0 15 ; 0 -15; 0 15" repeatCount="indefinite" begin="0.1"></animateTransform>
                                </circle>
                                <circle fill="#fff" stroke="none" cx="30" cy="50" r="6">
                                    <animateTransform attributeName="transform" dur="1s" type="translate" values="0 10 ; 0 -10; 0 10" repeatCount="indefinite" begin="0.2"></animateTransform>
                                </circle>
                                <circle fill="#fff" stroke="none" cx="54" cy="50" r="6">
                                    <animateTransform attributeName="transform" dur="1s" type="translate" values="0 5 ; 0 -5; 0 5" repeatCount="indefinite" begin="0.3"></animateTransform>
                                </circle>
                            </svg>                                    
                                </svg>                                    
                            </svg>                                    
                            <p></p>
                        </div>
                    </label>
                </form>
            </div>                        
                </div>                        
            </div>                        
            <div class="item title inlineField">
                <p class="ttle">Title</p>
                <input class="editTitle" type="text" placeholder="Title" autocomplete="off" maxlength="256" value="${encodeHTML(object.embed?.title || '')}">
            </div>
            <div class="item description"><p class="ttle">Description</p></div>
            <div class="edit">
                <textarea class="editDescription" placeholder="Embed description" maxlength="2048" autocomplete="off">${encodeHTML(object.embed?.description || '')}</textarea>
            </div>
            <div class="item fields"><p class="ttle">Fields</p></div>
            <div class="edit"></div>
            <div class="item thumbnail largeImg"><p class="ttle">Thumbnail</p></div>
            <div class="edit">
                <div class="linkName">
                    <div class="editIcon">
                        <span class="imgParent" ${object.embed?.thumbnail?.url ? 'style="content: url(' + encodeHTML(object.embed.thumbnail.url) + ')"' : ''}></span>
                        <div class="txtCol">
                            <input class="editThumbnailLink" type="text" value="${encodeHTML(object.embed?.thumbnail?.url || '')}" placeholder="Thumbnail URL" autocomplete="off" />
                            <form method="post" enctype="multipart/form-data">
                                <input class="browseThumbLink" type="file" name="file" id="file3" accept="image/png,image/gif,image/jpeg,image/webp" autocomplete="off" />
                                <label for="file3">
                                    <div class="browse">
                                        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" version="1.1" width="512" height="512" x="0" y="0" viewBox="0 0 64 64" xml:space="preserve">
                                            <g>
                                                <path xmlns="http://www.w3.org/2000/svg" d="m23.414 21.414 6.586-6.586v29.172c0 1.104.896 2 2 2s2-.896 2-2v-29.172l6.586 6.586c.39.391.902.586 1.414.586s1.024-.195 1.414-.586c.781-.781.781-2.047 0-2.828l-10-10c-.78-.781-2.048-.781-2.828 0l-10 10c-.781.781-.781 2.047 0 2.828.78.781 2.048.781 2.828 0z" fill="#ffffff" data-original="#000000"></path>
                                                <path xmlns="http://www.w3.org/2000/svg" d="m50 40c-1.104 0-2 .896-2 2v8c0 1.103-.897 2-2 2h-28c-1.103 0-2-.897-2-2v-8c0-1.104-.896-2-2-2s-2 .896-2 2v8c0 3.309 2.691 6 6 6h28c3.309 0 6-2.691 6-6v-8c0-1.104-.896-2-2-2z" fill="#ffffff" data-original="#000000"></path>
                                            </g>
                                        </svg>
                                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 0 0" xml:space="preserve">
                                            <circle fill="#fff" stroke="none" cx="6" cy="50" r="6">
                                                <animateTransform attributeName="transform" dur="1s" type="translate" values="0 15 ; 0 -15; 0 15" repeatCount="indefinite" begin="0.1"></animateTransform>
                                            </circle>
                                            <circle fill="#fff" stroke="none" cx="30" cy="50" r="6">
                                                <animateTransform attributeName="transform" dur="1s" type="translate" values="0 10 ; 0 -10; 0 10" repeatCount="indefinite" begin="0.2"></animateTransform>
                                            </circle>
                                            <circle fill="#fff" stroke="none" cx="54" cy="50" r="6">
                                                <animateTransform attributeName="transform" dur="1s" type="translate" values="0 5 ; 0 -5; 0 5" repeatCount="indefinite" begin="0.3"></animateTransform>
                                            </circle>
                                        </svg>
                                        <p></p>
                                    </div>
                                </label>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <div class="item image largeImg"><p class="ttle">Image</p></div>
            <div class="edit">
                <div class="linkName">
                    <div class="editIcon">
                        <span class="imgParent" ${object.embed?.image?.url ? 'style="content: url(' + encodeHTML(object.embed.image.url) + ')"' : ''}></span>
                        <div class="txtCol">
                            <input class="editImageLink" type="text" value="${encodeHTML(object.embed?.image?.url || '')}" placeholder="Image URL" autocomplete="off" />
                            <form method="post" enctype="multipart/form-data">
                                <input class="browseImageLink" type="file" name="file" id="file4" accept="image/png,image/gif,image/jpeg,image/webp" autocomplete="off" />
                                <label for="file4">
                                    <div class="browse">
                                        <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" version="1.1" width="512" height="512" x="0" y="0" viewBox="0 0 64 64" xml:space="preserve">
                                            <g>
                                                <path xmlns="http://www.w3.org/2000/svg" d="m23.414 21.414 6.586-6.586v29.172c0 1.104.896 2 2 2s2-.896 2-2v-29.172l6.586 6.586c.39.391.902.586 1.414.586s1.024-.195 1.414-.586c.781-.781.781-2.047 0-2.828l-10-10c-.78-.781-2.048-.781-2.828 0l-10 10c-.781.781-.781 2.047 0 2.828.78.781 2.048.781 2.828 0z" fill="#ffffff" data-original="#000000"></path>
                                                <path xmlns="http://www.w3.org/2000/svg" d="m50 40c-1.104 0-2 .896-2 2v8c0 1.103-.897 2-2 2h-28c-1.103 0-2-.897-2-2v-8c0-1.104-.896-2-2-2s-2 .896-2 2v8c0 3.309 2.691 6 6 6h28c3.309 0 6-2.691 6-6v-8c0-1.104-.896-2-2-2z" fill="#ffffff" data-original="#000000"></path>
                                            </g>
                                        </svg>
                                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 0 0" xml:space="preserve">
                                            <circle fill="#fff" stroke="none" cx="6" cy="50" r="6">
                                                <animateTransform attributeName="transform" dur="1s" type="translate" values="0 15 ; 0 -15; 0 15" repeatCount="indefinite" begin="0.1"></animateTransform>
                                            </circle>
                                            <circle fill="#fff" stroke="none" cx="30" cy="50" r="6">
                                                <animateTransform attributeName="transform" dur="1s" type="translate" values="0 10 ; 0 -10; 0 10" repeatCount="indefinite" begin="0.2"></animateTransform>
                                            </circle>
                                            <circle fill="#fff" stroke="none" cx="54" cy="50" r="6">
                                                <animateTransform attributeName="transform" dur="1s" type="translate" values="0 5 ; 0 -5; 0 5" repeatCount="indefinite" begin="0.3"></animateTransform>
                                            </circle>
                                        </svg>
                                        <p></p>
                                    </div>
                                </label>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
            <div class="item footer rows2"><p class="ttle">Footer</p></div>
            <div class="edit">
                <div class="linkName">
                    <div class="editIcon">
                        <span class="imgParent" ${object.embed?.footer?.icon_url ? 'style="content: url(' + encodeHTML(object.embed.footer.icon_url) + ')"' : ''}></span>
                        <input class="editFooterLink" type="text" value="${encodeHTML(object.embed?.footer?.icon_url || '')}" placeholder="Icon URL" autocomplete="off"/>
                    </div>
                    <div class="editName">
                        <input class="editFooterText" type="text" maxlength="2048" value="${encodeHTML(object.embed?.footer?.text || '')}" placeholder="Footer text" autocomplete="off" />
                    </div>
                </div>
                <form method="post" enctype="multipart/form-data">
                    <input class="browserFooterLink" type="file" name="file" id="file" accept="image/png,image/gif,image/jpeg,image/webp" autocomplete="off" />
                    <label for="file">
                        <div class="browse">
                            <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" version="1.1" width="512" height="512" x="0" y="0" viewBox="0 0 64 64" xml:space="preserve">
                                <g>
                                    <path xmlns="http://www.w3.org/2000/svg" d="m23.414 21.414 6.586-6.586v29.172c0 1.104.896 2 2 2s2-.896 2-2v-29.172l6.586 6.586c.39.391.902.586 1.414.586s1.024-.195 1.414-.586c.781-.781.781-2.047 0-2.828l-10-10c-.78-.781-2.048-.781-2.828 0l-10 10c-.781.781-.781 2.047 0 2.828.78.781 2.048.781 2.828 0z" fill="#ffffff" data-original="#000000"></path>
                                    <path xmlns="http://www.w3.org/2000/svg" d="m50 40c-1.104 0-2 .896-2 2v8c0 1.103-.897 2-2 2h-28c-1.103 0-2-.897-2-2v-8c0-1.104-.896-2-2-2s-2 .896-2 2v8c0 3.309 2.691 6 6 6h28c3.309 0 6-2.691 6-6v-8c0-1.104-.896-2-2-2z" fill="#ffffff" data-original="#000000"></path>
                                </g>
                            </svg>
                            <svg version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 100 100" enable-background="new 0 0 0 0" xml:space="preserve">
                                <circle fill="#fff" stroke="none" cx="6" cy="50" r="6">
                                    <animateTransform attributeName="transform" dur="1s" type="translate" values="0 15 ; 0 -15; 0 15" repeatCount="indefinite" begin="0.1"></animateTransform>
                                </circle>
                                <circle fill="#fff" stroke="none" cx="30" cy="50" r="6">
                                    <animateTransform attributeName="transform" dur="1s" type="translate" values="0 10 ; 0 -10; 0 10" repeatCount="indefinite" begin="0.2"></animateTransform>
                                </circle>
                                <circle fill="#fff" stroke="none" cx="54" cy="50" r="6">
                                    <animateTransform attributeName="transform" dur="1s" type="translate" values="0 5 ; 0 -5; 0 5" repeatCount="indefinite" begin="0.3"></animateTransform>
                                </circle>
                            </svg>                                    
                                </svg>                                    
                            </svg>                                    
                            <p></p>
                        </div>
                    </label>
                </form>
            </div>`;

        const fieldsEditor = gui.querySelector('.fields ~ .edit'), addField = `
            <div class="addField">
                <p>New Field</p>
                <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" version="1.1" x="0" y="0" viewBox="0 0 477.867 477.867" xml:space="preserve">
                    <g>
                        <g xmlns="http://www.w3.org/2000/svg">
                            <g>
                                <path d="M392.533,0h-307.2C38.228,0.056,0.056,38.228,0,85.333v307.2c0.056,47.105,38.228,85.277,85.333,85.333h307.2    c47.105-0.056,85.277-38.228,85.333-85.333v-307.2C477.81,38.228,439.638,0.056,392.533,0z M443.733,392.533    c0,28.277-22.923,51.2-51.2,51.2h-307.2c-28.277,0-51.2-22.923-51.2-51.2v-307.2c0-28.277,22.923-51.2,51.2-51.2h307.2    c28.277,0,51.2,22.923,51.2,51.2V392.533z" fill="#ffffff" data-original="#000000"
                                ></path>
                            </g>
                        </g>
                        <g xmlns="http://www.w3.org/2000/svg">
                            <g>
                                <path d="M324.267,221.867H256V153.6c0-9.426-7.641-17.067-17.067-17.067s-17.067,7.641-17.067,17.067v68.267H153.6    c-9.426,0-17.067,7.641-17.067,17.067S144.174,256,153.6,256h68.267v68.267c0,9.426,7.641,17.067,17.067,17.067    S256,333.692,256,324.267V256h68.267c9.426,0,17.067-7.641,17.067-17.067S333.692,221.867,324.267,221.867z" fill="#ffffff" data-original="#000000"></path>
                            </g>
                        </g>
                        <g xmlns="http://www.w3.org/2000/svg"></g>
                        <g xmlns="http://www.w3.org/2000/svg"></g>
                        <g xmlns="http://www.w3.org/2000/svg"></g>
                        <g xmlns="http://www.w3.org/2000/svg"></g>
                        <g xmlns="http://www.w3.org/2000/svg"></g>
                        <g xmlns="http://www.w3.org/2000/svg"></g>
                        <g xmlns="http://www.w3.org/2000/svg"></g>
                        <g xmlns="http://www.w3.org/2000/svg"></g>
                        <g xmlns="http://www.w3.org/2000/svg"></g>
                        <g xmlns="http://www.w3.org/2000/svg"></g>
                        <g xmlns="http://www.w3.org/2000/svg"></g>
                        <g xmlns="http://www.w3.org/2000/svg"></g>
                        <g xmlns="http://www.w3.org/2000/svg"></g>
                        <g xmlns="http://www.w3.org/2000/svg"></g>
                        <g xmlns="http://www.w3.org/2000/svg"></g>
                    </g>
                </svg>
            </div>`;
        if (object.embed?.fields) fieldsEditor.innerHTML = object.embed.fields.filter(f => f && typeof f === 'object').map(f => `
            <div class="field">
                <div class="fieldNumber"></div>
                <div class="fieldInner">
                    <div class="designerFieldName">
                        <input type="text" placeholder="Field name" autocomplete="off" maxlength="256" value="${encodeHTML(f.name)}">
                    </div>
                    <div class="designerFieldValue">
                        <textarea placeholder="Field value" autocomplete="off" maxlength="1024">${encodeHTML(f.value)}</textarea>
                    </div>
                </div>
                <div class="inlineCheck">
                    <label>
                        <input type="checkbox" autocomplete="off" ${f.inline ? 'checked' : ''}>
                        <span>Inline</span>
                    </label>
                </div>
                <div class="removeBtn">
                    <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svgjs="http://svgjs.com/svgjs" version="1.1" width="512" height="512" x="0" y="0" viewBox="0 0 329.26933 329" xml:space="preserve">
                        <g>
                            <path xmlns="http://www.w3.org/2000/svg" d="m194.800781 164.769531 128.210938-128.214843c8.34375-8.339844 8.34375-21.824219 0-30.164063-8.339844-8.339844-21.824219-8.339844-30.164063 0l-128.214844 128.214844-128.210937-128.214844c-8.34375-8.339844-21.824219-8.339844-30.164063 0-8.34375 8.339844-8.34375 21.824219 0 30.164063l128.210938 128.214843-128.210938 128.214844c-8.34375 8.339844-8.34375 21.824219 0 30.164063 4.15625 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921875-2.089844 15.082031-6.25l128.210937-128.214844 128.214844 128.214844c4.160156 4.160156 9.621094 6.25 15.082032 6.25 5.460937 0 10.921874-2.089844 15.082031-6.25 8.34375-8.339844 8.34375-21.824219 0-30.164063zm0 0" fill="#ffffff" data-original="#000000"/>
                        </g>
                    </svg>
                    <span>Remove</span>
                </div>
            </div>`).join('\n') + addField;
        else fieldsEditor.innerHTML = addField;

        gui.querySelectorAll('.removeBtn').forEach(e => {
            e.addEventListener('click', el => {
                fields = gui.querySelector('.fields ~ .edit');
                let field = el.target.closest('.field');
                if (field) {
                    let i = Array.from(fields.children).indexOf(field), jsonField = object.embed.fields[i];
                    if (jsonField) {
                        object.embed.fields.splice(i, 1);
                        field.remove();
                        update(object);
                    }
                }
            })
        })

        document.querySelectorAll('.gui > .item').forEach(e => {
            e.addEventListener('click', el => {
                let elm = (el.target.closest('.top>.gui>.item') || el.target);
                if (elm.classList.contains('active')) getSelection().anchorNode !== elm && elm.classList.remove('active');
                else {
                    let inlineField = elm.closest('.inlineField'),
                        input = elm.nextElementSibling.querySelector('input[type="text"]'),
                        txt = elm.nextElementSibling.querySelector('textarea');
                    elm.classList.add('active');
                    if (inlineField) inlineField.querySelector('.ttle~input').focus();
                    else if (input) {
                        if (!smallerScreen.matches)
                            input.focus();
                        input.selectionStart = input.selectionEnd = input.value.length;
                    } else if (txt && !smallerScreen.matches)
                        txt.focus();
                    if (elm.classList.contains('fields')) {
                        if (reverseColumns && smallerScreen.matches)
                            // return elm.nextElementSibling.scrollIntoView({ behavior: 'smooth', block: "end" });
                            return elm.parentNode.scrollTop = elm.offsetTop;
                        elm.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                }
            })
        })

        // Scroll into view when tabs are opened in the GUI.
        let lastTabs = Array.from(document.querySelectorAll('.footer.rows2, .image.largeImg')),
            requiresView = matchMedia(`${smallerScreen.media}, (max-height: 845px)`);
        document.querySelectorAll('.gui>.item:not(.fields)').forEach(e => e.addEventListener('click', () => {
            if (lastTabs.includes(e) || requiresView.matches) {
                if (!reverseColumns || !smallerScreen.matches) e.scrollIntoView({ behavior: 'smooth', block: "center" });
                else if (e.nextElementSibling.classList.contains('edit') && e.classList.contains('active'))
                    // e.nextElementSibling.scrollIntoView({ behavior: 'smooth', block: "end" });
                    e.parentNode.scrollTop = e.offsetTop;
            }
        }));

        content = gui.querySelector('.editContent');
        title = gui.querySelector('.editTitle');
        authorName = gui.querySelector('.editAuthorName');
        authorLink = gui.querySelector('.editAuthorLink');
        desc = gui.querySelector('.editDescription');
        thumbLink = gui.querySelector('.editThumbnailLink');
        imgLink = gui.querySelector('.editImageLink');
        footerText = gui.querySelector('.editFooterText');
        footerLink = gui.querySelector('.editFooterLink');
        fields = gui.querySelector('.fields ~ .edit');

        document.querySelector('.addField').addEventListener('click', () => {
            !json.embed && (json.embed = {});
            let arr = json.embed.fields || [];
            if (arr.length >= 25) return error('Cannot have more than 25 fields', 5000);
            arr.push({ name: "Field name", value: "Field value", inline: false });
            json.embed.fields = arr;
            update(json);
            buildGui(json, { newField: true, activate: document.querySelectorAll('.gui > .item.active') });
        })

        gui.querySelectorAll('textarea, input').forEach(e => e.addEventListener('input', el => {
            const value = el.target.value, field = el.target.closest('.field');
            if (field) {
                const jsonField = json.embed.fields[Array.from(fields.children).filter(e => e.className === 'field').indexOf(field)];
                if (jsonField) {
                    if (el.target.type === 'text') jsonField.name = value;
                    else if (el.target.type === 'textarea') jsonField.value = value;
                    else jsonField.inline = el.target.checked;
                } else {
                    const obj = {}
                    if (el.target.type === 'text') obj.name = value;
                    else if (el.target.type === 'textarea') obj.value = value;
                    else obj.inline = el.target.checked;
                    json.embed.fields.push(obj);
                }
            } else {
                json.embed ??= {};
                switch (el.target) {
                    case content: json.content = value; break;
                    case title: json.embed.title = value; break;
                    case authorName: json.embed.author ??= {}, json.embed.author.name = value; break;
                    case authorLink: json.embed.author ??= {}, json.embed.author.icon_url = value, imgSrc(el.target.previousElementSibling, value); break;
                    case desc: json.embed.description = value; break;
                    case thumbLink: json.embed.thumbnail ??= {}, json.embed.thumbnail.url = value, imgSrc(el.target.closest('.editIcon').querySelector('.imgParent'), value); break;
                    case imgLink: json.embed.image ??= {}, json.embed.image.url = value, imgSrc(el.target.closest('.editIcon').querySelector('.imgParent'), value); break;
                    case footerText: json.embed.footer ??= {}, json.embed.footer.text = value; break;
                    case footerLink: json.embed.footer ??= {}, json.embed.footer.icon_url = value, imgSrc(el.target.previousElementSibling, value); break;
                }
            }
            update(json);
        }))

        if (opts?.guiTabs) {
            let tabs = opts.guiTabs.split?.(/, */) || opts.guiTabs, bottomKeys = ['footer', 'image'], topKeys = ['author', 'content'];
            document.querySelectorAll(`.${tabs.join(', .')}`).forEach(e => e.classList.add('active'));

            // Autoscroll GUI to the bottom if necessary.
            if (!tabs.some(item => topKeys.includes(item)) && tabs.some(item => bottomKeys.includes(item))) {
                let gui2 = document.querySelector('.top .gui');
                gui2.scrollTo({ top: gui2.scrollHeight });
            }
        } else if (opts?.activate) {
            Array.from(opts.activate).map(el => el.className).map(clss => '.' + clss.split(' ').slice(0, 2).join('.'))
                .forEach(clss => document.querySelectorAll(clss)
                    .forEach(e => e.classList.add('active')))
        } else
            document.querySelectorAll('.item.author, .item.description').forEach(clss => clss.classList.add('active'));

        if (opts?.newField) {
            let last = fields.children[fields.childElementCount - 2], el = last.querySelector('.designerFieldName > input');
            el.setSelectionRange(el.value.length, el.value.length); el.focus();
            last.scrollIntoView({ behavior: "smooth", block: "center" });
        }

        let upload = form => {
            let formData = new FormData(form);
            formData.append('file', files.files);
            formData.append('datetime', '10m');
            fetch('https://tempfile.site/api/files', {
                method: 'POST',
                body: formData,
            })
                .then(res => res.json())
                .then(res => {
                    let browse = form.closest('.edit').querySelector('.browse');
                    browse.classList.remove('loading');
                    if (!res.ok) {
                        console.log(res.error);
                        browse.classList.add('error');
                        return setTimeout(() => browse.classList.remove('error'), 5000)
                    }
                    imgSrc(form.previousElementSibling.querySelector('.editIcon > .imgParent') || form.closest('.editIcon').querySelector('.imgParent'), res.link);
                    let input = form.previousElementSibling.querySelector('.editIcon > input') || form.previousElementSibling;
                    input.value = res.link;
                    if (input === authorLink) ((json.embed ??= {}).author ??= {}).icon_url = res.link;
                    else if (input === thumbLink) ((json.embed ??= {}).thumbnail ??= {}).url = res.link;
                    else if (input === imgLink) ((json.embed ??= {}).image ??= {}).url = res.link;
                    else ((json.embed ??= {}).footer ??= {}).icon_url = res.link;
                    update(json);
                    console.info(`Image (${res.link}) will be deleted in 10 minutes. To delete it now, go to ${res.link.replace('/files', '/del')} and enter this code: ${res.authkey}`);
                }).catch(err => error(`Request to tempfile.site failed with error: ${err}`, 5000))
        }

        const files = document.querySelectorAll('input[type="file"]');
        files.forEach(f => f.addEventListener('change', e => {
            if (f.files) {
                upload(e.target.parentElement);
                e.target.closest('.edit').querySelector('.browse').classList.add('loading');
            }
        }))
    }

    buildGui(json, { guiTabs });
    fields = gui.querySelector('.fields ~ .edit');
    update = data => {
        try {
            if (!data.content) document.body.classList.add('emptyContent');
            else {
                innerHTML(embedContent, markup(encodeHTML(data.content), { replaceEmojis: true }));
                document.body.classList.remove('emptyContent');
            }
            if (data.embed && Object.keys(data.embed).length) {
                const emb = data.embed;
                if (!allGood(emb)) return;

                validationError = false;
                if (emb.title) display(embedTitle, markup(`${emb.url ? '<a class="anchor" target="_blank" href="' + encodeHTML(url(emb.url)) + '">' + encodeHTML(emb.title) + '</a>' : encodeHTML(emb.title)}`, { replaceEmojis: true, inlineBlock: true }));
                else hide(embedTitle);

                if (emb.description) display(embedDescription, markup(encodeHTML(emb.description), { inEmbed: true, replaceEmojis: true }));
                else hide(embedDescription);

                if (emb.color) embed.closest('.embed').style.borderColor = (typeof emb.color === 'number' ? '#' + emb.color.toString(16).padStart(6, "0") : emb.color);
                else embed.closest('.embed').style.removeProperty('border-color');

                if (emb.author?.name) display(embedAuthor, `
                    ${emb.author.icon_url ? '<img class="embedAuthorIcon" src="' + encodeHTML(url(emb.author.icon_url)) + '">' : ''}
                    ${emb.author.url ? '<a class="embedAuthorNameLink embedLink embedAuthorName" href="' + encodeHTML(url(emb.author.url)) + '" target="_blank">' + encodeHTML(emb.author.name) + '</a>' : '<span class="embedAuthorName">' + encodeHTML(emb.author.name) + '</span>'}`, 'flex');
                else hide(embedAuthor);

                const pre = embed.querySelector('.markup pre');
                if (emb.thumbnail?.url) {
                    embedThumbnail.src = emb.thumbnail.url,
                        embedThumbnail.parentElement.style.display = 'block';
                    if (pre) pre.style.maxWidth = '90%';
                } else {
                    hide(embedThumbnail.parentElement);
                    if (pre) pre.style.removeProperty('max-width');
                }

                if (emb.image?.url)
                    embedImage.src = emb.image.url,
                        embedImage.parentElement.style.display = 'block';
                else hide(embedImage.parentElement);

                if (emb.footer?.text) display(embedFooter, `
                    ${emb.footer.icon_url ? '<img class="embedFooterIcon" src="' + encodeHTML(url(emb.footer.icon_url)) + '">' : ''}<span class="embedFooterText">
                        ${encodeHTML(emb.footer.text)}
                    ${emb.timestamp ? '<span class="embedFooterSeparator">•</span>' + encodeHTML(tstamp(emb.timestamp)) : ''}</span></div>`, 'flex');
                else if (emb.timestamp) display(embedFooter, `<span class="embedFooterText">${encodeHTML(tstamp(emb.timestamp))}</span></div>`, 'flex');
                else hide(embedFooter);

                if (emb.fields) {
                    innerHTML(embedFields, '');
                    let index, gridCol;

                    emb.fields.forEach((f, i) => {
                        if (f.name && f.value) {
                            let fieldElement = embedFields.insertBefore(document.createElement('div'), null);
                            // Figuring out if there are only two fields on a row to give them more space.
                            // e.fields = json.embeds.fields.

                            // if both the field of index 'i' and the next field on its right are inline and -
                            if (emb.fields[i].inline && emb.fields[i + 1]?.inline &&
                                // it's the first field in the embed or -
                                ((i === 0 && emb.fields[i + 2] && !emb.fields[i + 2].inline) || ((
                                    // it's not the first field in the embed but the previous field is not inline or - 
                                    i > 0 && !emb.fields[i - 1].inline ||
                                    // it has 3 or more fields behind it and 3 of those are inline except the 4th one back if it exists -
                                    i >= 3 && emb.fields[i - 1].inline && emb.fields[i - 2].inline && emb.fields[i - 3].inline && (emb.fields[i - 4] ? !emb.fields[i - 4].inline : !emb.fields[i - 4])
                                    // or it's the first field on the last row or the last field on the last row is not inline or it's the first field in a row and it's the last field on the last row.
                                ) && (i == emb.fields.length - 2 || !emb.fields[i + 2].inline))) || i % 3 === 0 && i == emb.fields.length - 2) {
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
                                if (i && !emb.fields[i - 1].inline) colNum = 1;

                                fieldElement.outerHTML = `
                                    <div class="embedField ${num}${gridCol ? ' colNum-2' : ''}" style="grid-column: ${gridCol || (colNum + ' / ' + (colNum + 4))};">
                                        <div class="embedFieldName">${markup(encodeHTML(f.name), { inEmbed: true, replaceEmojis: true, inlineBlock: true })}</div>
                                        <div class="embedFieldValue">${markup(encodeHTML(f.value), { inEmbed: true, replaceEmojis: true })}</div>
                                    </div>`;

                                if (index !== i) gridCol = false;
                            }
                            colNum = (colNum === 9 ? 1 : colNum + 4);
                            num++;
                        }
                    });

                    document.querySelectorAll('.embedField[style="grid-column: 1 / 5;"]').forEach(e => {
                        if (!e.nextElementSibling || e.nextElementSibling.style.gridColumn === '1 / 13')
                            e.style.gridColumn = '1 / 13';
                    });
                    colNum = 1;

                    display(embedFields, undefined, 'grid');
                } else hide(embedFields);

                document.body.classList.remove('emptyEmbed');
                for (block of document.querySelectorAll('.markup pre > code'))
                    hljs.highlightBlock(block);

                error(false);
                twemoji.parse(msgEmbed);
            } else
                document.body.classList.add('emptyEmbed');

            // Make sure that the embed has no text or any visible images such as custom emojis before hiding.
            if (!embedCont.innerText && !document.querySelector('.messageContent + .container .embedGrid > [style*=display] img'))
                document.body.classList.add('emptyEmbed');

            json = data;
            if (autoUpdateURL)
                urlOptions({ set: ['data', jsonToBase64(json)] })
        } catch (e) {
            console.error(e);
            console.dir(e);
            error(e);
        }
    }

    editor.on('change', editor => {
        // // Autofill when " key is typed on new line
        // let line = editor.getCursor().line, text = editor.getLine(line)
        // if (text.trim() === '"') {
        //     editor.replaceRange(text.trim() + ': ', { line, ch: line.length });
        //     editor.setCursor(line, text.length)
        // }

        let jsonData = JSON.parse(editor.getValue()), dataKeys = Object.keys(jsonData);
        if (!dataKeys.includes('embed') && !dataKeys.includes('embed') && mainKeys.some(key => dataKeys.includes(key))) {
            editor.setValue(JSON.stringify({ embed: jsonData }, null, 4));
            editor.refresh();
        }

        try {
            if (dataKeys.length && !jsonKeys.some(key => dataKeys.includes(key))) {
                let usedKeys = dataKeys.filter(key => !jsonKeys.includes(key));
                if (usedKeys.length > 2)
                    return error(`'${usedKeys[0] + "', '" + usedKeys.slice(1, usedKeys.length - 1).join("', '")}', and '${usedKeys[usedKeys.length - 1]}' are invalid keys.`);
                return error(`'${usedKeys.length == 2 ? usedKeys[0] + "' and '" + usedKeys[usedKeys.length - 1] + "' are invalid keys." : usedKeys[0] + "' is an invalid key."}`);
            } else if (!validationError)
                error(false);
            update(jsonData);
        }
        catch (e) {
            if (editor.getValue()) return;
            document.body.classList.add('emptyEmbed');
            innerHTML(embedContent, '');
        }
    });

    let picker = new CP(document.querySelector('.picker'), state = { parent: document.querySelector('.cTop') });
    picker.fire('change', toRGB('#41f097'));

    let colors = document.querySelector('.colors'),
        hexInput = colors.querySelector('.hex>div input'),
        typingHex = true, exit = false,
        removePicker = () => {
            if (exit) return exit = false;
            if (typingHex) picker.enter();
            else {
                typingHex = false, exit = true;
                colors.classList.remove('picking');
                picker.exit();
            }
        }
    document.querySelector('.colBack').addEventListener('click', () => {
        picker.self.remove();
        typingHex = false;
        removePicker();
    })

    picker.on('exit', removePicker);
    picker.on('enter', () => {
        if (json?.embed?.color) {
            hexInput.value = json.embed.color.toString(16).padStart(6, '0');
            document.querySelector('.hex.incorrect')?.classList.remove('incorrect');
        }
        colors.classList.add('picking')
    })

    document.querySelectorAll('.color').forEach(e => e.addEventListener('click', el => {
        el = el.target.closest('.color') || el.target;
        embed.closest('.embed').style.borderColor = el.style.backgroundColor;
        json.embed && (json.embed.color = toRGB(el.style.backgroundColor, false, true));
        picker.source.style.removeProperty('background');
    }))

    hexInput.addEventListener('focus', () => typingHex = true);
    setTimeout(() => {
        picker.on('change', function (r, g, b, a) {
            embed.closest('.embed').style.borderColor = this.color(r, g, b);
            json.embed && (json.embed.color = parseInt(this.color(r, g, b).slice(1), 16));
            picker.source.style.background = this.color(r, g, b);
            hexInput.value = json.embed.color.toString(16).padStart(6, '0');
        })
    }, 1000)

    document.querySelector('.timeText').innerText = tstamp();
    for (block of document.querySelectorAll('.markup pre > code'))
        hljs.highlightBlock(block);
    document.querySelector('.opt.gui').addEventListener('click', () => {
        json = JSON.parse(editor.getValue() || '{}');
        buildGui(json, { activate: activeFields });
        document.body.classList.add('gui');
        activeFields = null;
        if (pickInGuiMode) {
            pickInGuiMode = false;
            togglePicker();
        }
    })

    document.querySelector('.opt.json').addEventListener('click', () => {
        let jsonData = JSON.stringify(json, null, 4);
        editor.setValue(jsonData === '{}' ? '{\n\t\n}' : jsonData);
        editor.refresh();
        document.body.classList.remove('gui');
        // if (!smallerScreen.matches)
        editor.focus();
        activeFields = document.querySelectorAll('.gui > .item.active');
        if (document.querySelector('section.low'))
            togglePicker(true);
    })

    document.querySelector('.clear').addEventListener('click', () => {
        json = {};
        embed.style.removeProperty('border-color');
        picker.source.style.removeProperty('background');
        update(json); buildGui(json); editor.setValue('{\n\t\n}');
        document.querySelectorAll('.gui>.item').forEach(e => e.classList.add('active'));
        if (!smallerScreen.matches)
            content.focus();
    })

    document.querySelector('.top-btn.menu')?.addEventListener('click', e => {
        if (e.target.closest('.item.dataLink')) {
            const data = jsonToBase64(json, true);
            // With long text inside a 'prompt' on Chromium based browsers, some text will but cut and replaced with '...'.
            // So, for the Chromium users, we copy to clipboard instead of showing a prompt.
            if (!window.chrome)
                return prompt('Here\'s the current URL with base64 embed data:', data);
            if (location.protocol === 'http:')
                // Clipboard API only works on HTTPS protocol.
                navigator.clipboard.writeText(data);
            else {
                const input = document.createElement('input');
                input.value = data;
                document.body.appendChild(input);
                input.select();
                document.execCommand('copy');
                document.body.removeChild(input);
            }

            alert('Copied to clipboard.');
        }

        const input = e.target.closest('.item')?.querySelector('input');
        if (input) input.checked = !input.checked;

        if (e.target.closest('.item.auto')) {
            console.log('Burv');
            autoUpdateURL = document.body.classList.toggle('autoUpdateURL');
            if (autoUpdateURL) localStorage.setItem('autoUpdateURL', true);
            else localStorage.removeItem('autoUpdateURL');
            update(json);
        } else if (e.target.closest('.item.reverse')) {
            reverse(reverseColumns);
            reverseColumns = !reverseColumns;
            toggleStored('reverseColumns');
        } else if (e.target.closest('.item.noUser')) {
            if (options.avatar) document.querySelector('img.avatar').src = options.avatar;
            document.body.classList.toggle('no-user');
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
        }
        e.target.closest('.top-btn').classList.toggle('active')
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
        pickLater && (pickInGuiMode = true);
    };

    document.querySelector('.pickerToggle').addEventListener('click', togglePicker);
    update(json);

    document.body.addEventListener('click', e => {
        if (e.target.classList.contains('low') || (e.target.classList.contains('top') && colors.classList.contains('display')))
            togglePicker();
    })

    document.querySelector('.colors .hex>div').addEventListener('input', e => {
        let inputValue = e.target.value;
        if (inputValue.startsWith('#'))
            e.target.value = inputValue.slice(1), inputValue = e.target.value;
        if (inputValue.length !== 6 || !/^[a-zA-Z0-9]{6}$/g.test(inputValue))
            return e.target.closest('.hex').classList.add('incorrect');
        e.target.closest('.hex').classList.remove('incorrect');
        json.embed.color = parseInt(inputValue, 16);
        update(json);
    })

    if (onlyEmbed) document.querySelector('.side1')?.remove();

    document.querySelector('.top-btn.copy').addEventListener('click', e => {
        const mark = e.target.closest('.top-btn.copy').querySelector('.mark'),
            jsonData = JSON.stringify(json, null, 4),
            next = () => {
                mark.classList.remove('hidden');
                mark.previousElementSibling.classList.add('hidden');

                setTimeout(() => {
                    mark.classList.add('hidden');
                    mark.previousElementSibling.classList.remove('hidden');
                }, 1500);
            }

        if (!navigator.clipboard?.writeText(jsonData).then(next).catch(err => alert('Could not copy to clipboard: ' + err.message))) {
            const textarea = document.createElement('textarea');
            textarea.value = jsonData;
            document.body.appendChild(textarea);
            textarea.select();
            textarea.setSelectionRange(0, 50000);
            document.execCommand('copy');
            document.body.removeChild(textarea);
            next();
        }
    });
});

console.__proto__.message = function (title, message, collapse = true) {
    collapse && this.groupCollapsed(title) || this.group(title);
    this.dir(message);
    this.groupEnd();
}
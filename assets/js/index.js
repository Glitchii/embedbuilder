
// Want to use or contribute to this? https://github.com/Glitchii/embedbuilder
// If you found an issue, please report it, make a P.R, or use the discussion page. Thanks

var colNum = 1, num = 0;
window.onload = () => {
    document.querySelectorAll('img.clickable')
        .forEach(e => e.addEventListener('click', el => window.open(el.target.src)));
    let textarea = document.querySelector('textarea');
    window.editor = CodeMirror(elt => textarea.parentNode.replaceChild(elt, textarea), {
        value: textarea.value,
        theme: 'material-darker',
        scrollbarStyle: "overlay",
        mode: "application/json",
        // lineNumbers: true,
        foldGutter: true,
        gutters: ["CodeMirror-foldgutter", "CodeMirror-lint-markers"],
        matchBrackets: true,
        lint: true
    });

    editor.focus();
    let notif = document.querySelector('.notification'),
        url = (url) => /^(https?:)?\/\//g.exec(url) ? url : '//' + url,
        makeShort = (txt, length, mediaWidth) => {
            if (mediaWidth && window.matchMedia(`(max-width:${mediaWidth}px)`).matches)
                return txt.length > (length - 3) ? txt.substring(0, length - 3) + '...' : txt;
            return txt;
        }, error = (msg, html) => {
            if (html) notif.innerHTML = msg;
            else notif.innerText = msg;
            notif.style.display = 'block';
            // err && console.log(err);
        }, markup = (txt, isEmbed) => {
            txt = txt
                // Custom Emojis
                .replace(/<a?:[^:]+?:(\d+)>/g, '<img class="emoji" src="https://cdn.discordapp.com/emojis/$1.png"/>') // .replace(/<a?:[^:]+?:(\d+)>/g, '<img class="emoji" src="https://cdn.discordapp.com/emojis/$1.gif" onerror="this.src=\'https://cdn.discordapp.com/emojis/$1.png\'"/>') // This will keep logging failed GET request errors in console
                // MD
                .replace(/~~(.+?)~~/g, '<s>$1</s>')
                .replace(/\`(?!\`)([^\`]+?)\`(?!\`)/g, '<code class="inline">$1</code>')
                .replace(/\`\`(?!\`)([^\`]+?)\`\`(?!\`)/g, '<code class="inline">$1</code>')
                .replace(/\*\*\*(.+?)\*\*\*/g, '<em><strong>$1</strong></em>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/__(.+?)__/g, '<u>$1</u>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/_(.+?)_/g, '<em>$1</em>')
                // Block
                .replace(/\n/g, '<br>')
                .replace(/\`\`\`(\w{1,15})<br>((\n|.)+?)\`\`\`/g, isEmbed ? '<pre class="embeded"><code class="$1">$2</code></pre>' : '<pre><code class="$1">$2</code></pre>')
                .replace(/\`\`\`(\w{1,15})<br>((\n|.)+?)\`\`\`/g, isEmbed ? '<pre class="embeded"><code class="$1">$2</code></pre>' : '<pre><code class="$1">$2</code></pre>')
                .replace(/\`\`\`(<br>)?((\n|.)+?)\`\`\`/g, isEmbed ? '<pre class="embeded"><code class="hljs nohighlight">$2</code></pre>' : '<pre><code class="hljs nohighlight">$2</code></pre>')
            if (isEmbed) txt = txt
                .replace(/\[(.+)\]\((.+)\)/g, `<a title="$1" target="_blank" class="anchor" href="$2">$1</a>`);
            return txt;
        },
        content = document.querySelector('.messageContent'),
        embed = document.querySelector('.embedGrid'),
        msgEmbed = document.querySelector('.msgEmbed'),
        embedTitle = document.querySelector('.embedTitle'),
        embedDescription = document.querySelector('.embedDescription'),
        embedAuthor = document.querySelector('.embedAuthor'),
        embedFooter = document.querySelector('.embedFooter'),
        embedImage = document.querySelector('.embedImage'),
        embedThumbnail = document.querySelector('.embedThumbnail'),
        fields = embed.querySelector('.embedFields'),
        tstamp = stringISO => {
            let date = stringISO ? new Date(stringISO) : new Date(),
                dateArray = date.toLocaleString('en-US', { hour: 'numeric', hour12: true, minute: 'numeric' }),
                today = new Date(),
                yesterday = new Date(new Date().setDate(today.getDate() - 1));

            return today.toDateString() === date.toDateString() ? `Today at ${dateArray}` :
                yesterday.toDateString() === date.toDateString() ? `Yesterday at ${dateArray}` :
                    `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}/${date.getFullYear()}`;
        }, display = (el, data, displayType) => {
            if (data) el.innerHTML = data;
            el.style.display = displayType || "unset";

        }, hide = el => el.style.removeProperty('display'),
        toObj = jsonString => JSON.parse(jsonString.replace(/\\"|"(?:\\"|[^"])*"|(\/\/.*|\/\*[\s\S]*?\*\/)/g, (x, y) => y ? "" : x)),
        update = data => {
            try {
                content.innerHTML = data.content ? markup(data.content) : '';
                if (data.embed) {
                    let e = data.embed;
                    if (e.title) display(embedTitle, markup(`${e.url ? '<a class="anchor" target="_blank" href="' + url(e.url) + '">' + e.title + '</a>' : e.title}`));
                    else hide(embedTitle);
                    if (e.description) display(embedDescription, markup(e.description, true));
                    else hide(embedDescription);
                    if (e.color) embed.closest('.embed').style.borderColor = (typeof e.color === 'number' ? '#' + e.color.toString(16) : e.color);
                    else embed.closest('.embed').style.removeProperty('border-color');
                    if (e.author && e.author.name) display(embedAuthor, `
                        ${e.author.icon_url ? '<img class="embedAuthorIcon" src="' + url(e.author.icon_url) + '">' : ''}
                        ${e.author.url ? '<a class="embedAuthorNameLink embedLink embedAuthorName" href="' + url(e.author.url) + '" target="_blank">' + e.author.name + '</a>' : '<span class="embedAuthorName">' + e.author.name + '</span>'}`, 'flex');
                    else hide(embedAuthor);
                    if (e.thumbnail && e.thumbnail.url) embedThumbnail.src = e.thumbnail.url, embedThumbnail.style.display = 'block';
                    else hide(embedThumbnail);
                    if (e.image && e.image.url) embedImage.src = e.image.url, embedImage.style.display = 'block';
                    else hide(embedImage);
                    if (e.footer && e.footer.text) display(embedFooter, `
                        ${e.footer.icon_url ? '<img class="embedFooterIcon" src="' + url(e.footer.icon_url) + '">' : ''}<span class="embedFooterText">
                            ${e.footer.text}
                        ${e.timestamp ? '<span class="embedFooterSeparator">•</span>' + tstamp(e.timestamp) : ''}</span></div>`, 'flex');
                    else if (e.timestamp) display(embedFooter, `<span class="embedFooterText">${tstamp(e.timestamp)}</span></div>`, 'flex');
                    else hide(embedFooter);
                    if (e.fields) {
                        fields.innerHTML = '';
                        e.fields.forEach(f => {
                            if (!f.inline) {
                                let el = fields.insertBefore(document.createElement('div'), null);
                                el.outerHTML = `
                                <div class="embedField" style="grid-column: 1 / 13;">
                                    <div class="embedFieldName">${markup(f.name)}</div>
                                    <div class="embedFieldValue">${markup(f.value)}</div>
                                </div>`;
                            } else {
                                el = fields.insertBefore(document.createElement('div'), null);
                                el.outerHTML = `
                                <div class="embedField ${num}" style="grid-column: ${colNum} / ${colNum + 4};">
                                    <div class="embedFieldName">${markup(f.name)}</div>
                                    <div class="embedFieldValue">${markup(f.value)}</div>
                                </div>`;
                                colNum = (colNum === 9 ? 1 : colNum + 4);
                                num++;
                            }
                        });
                        colNum = 1;
                        let len = e.fields.filter(f => f.inline).length;
                        if (len === 2 || (len > 3 && len % 2 !== 0)) {
                            let children = Array.from(fields.children),
                                arr = children.filter(x => x === children[len] || x === children[len - 1]);
                            arr[0].style.gridColumn = '1 / 7', arr[1].style.gridColumn = '7 / 13';
                        }
                        display(fields, undefined, 'grid');
                    } else hide(fields);
                    embed.classList.remove('empty');
                    let re = /"((icon_)?url")(: *)("(?!\w+?:\/\/).+?")/g.exec(editor.getValue())
                    if (re) error(`URLs should have a valid protocol (eg. https://) on this line <span class="inline">${makeShort(re[0], 30, 600)}</span>`, true);
                    else notif.animate({ opacity: '0', bottom: '-50px', offset: 1 }, { easing: 'ease', duration: 500 }).onfinish = () => notif.style.removeProperty('display');
                }
            } catch (e) {
                error(e);
            }
        }

    editor.on('change', editor => {
        try { update(toObj(editor.getValue())); }
        catch (e) {
            if (editor.getValue()) return; // error("Couldn't parse JSON; Invalid JSON syntax", e)
            embed.classList.add('empty');
            content.innerHTML = '';
        }
        document.querySelectorAll('.markup pre > code').forEach((block) => hljs.highlightBlock(block));
        twemoji.parse(msgEmbed);
    });

    update(toObj(editor.getValue()));
    twemoji.parse(msgEmbed);
    document.querySelector('.timeText').innerText = tstamp()
    document.querySelectorAll('.markup pre > code').forEach((block) => hljs.highlightBlock(block))
    !window.navigator.userAgent.match(/Firefox\/[\d\.]+$/g) && // Firefox pushes the text up a little
        document.querySelector('.botText').style.removeProperty('top');
};
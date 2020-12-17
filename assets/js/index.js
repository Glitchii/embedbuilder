
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
        foldGutter: true,
        gutters: ["CodeMirror-foldgutter", "CodeMirror-lint-markers"],
        matchBrackets: true,
        lint: true,
        extraKeys: {
            "Tab": cm => cm.replaceSelection("    ", "end")
        }
    });

    editor.focus();
    let notif = document.querySelector('.notification'),
        url = (url) => /^(https?:)?\/\//g.exec(url) ? url : '//' + url,
        makeShort = (txt, length, mediaWidth) => {
            if (mediaWidth && window.matchMedia(`(max-width:${mediaWidth}px)`).matches)
                return txt.length > (length - 3) ? txt.substring(0, length - 3) + '...' : txt;
            return txt;
        }, error = (msg, time) => {
            notif.innerHTML = msg, notif.style.display = 'block';
            time && setTimeout(() => notif.animate({ opacity: '0', bottom: '-50px', offset: 1 }, { easing: 'ease', duration: 500 })
                .onfinish = () => notif.style.removeProperty('display'), time);
            return false;
        }, allGood = e => {
            let re = /"((icon_)?url")(: *)("(?!https?:\/\/).+?")/g.exec(editor.getValue());
            if (re) return error(`URL should start with <code>https://</code> or <code>http://</code> on this line <span class="inline full">${makeShort(re[0], 30, 600)}</span>`);
            if (e.timestamp && new Date(e.timestamp).toString() === "Invalid Date") return error('Timestamp is invalid');
            return true;
        }, markup = (txt, opts) => {
            txt = txt
                .replace(/<:[^:]+:(\d+)>/g, '<img class="emoji" src="https://cdn.discordapp.com/emojis/$1.png"/>')
                .replace(/<a:[^:]+:(\d+)>/g, '<img class="emoji" src="https://cdn.discordapp.com/emojis/$1.gif"/>')
                .replace(/~~(.+?)~~/g, '<s>$1</s>')
                .replace(/\*\*\*(.+?)\*\*\*/g, '<em><strong>$1</strong></em>')
                .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                .replace(/__(.+?)__/g, '<u>$1</u>')
                .replace(/\*(.+?)\*/g, '<em>$1</em>')
                .replace(/_(.+?)_/g, '<em>$1</em>')
            if (opts.inlineBlock) txt = txt.replace(/\`([^\`]+?)\`|\`\`([^\`]+?)\`\`|\`\`\`((?:\n|.)+?)\`\`\`/g, (m, x, y, z) => x ? `<code class="inline">${x}</code>` : y ? `<code class="inline">${y}</code>` : z ? `<code class="inline">${z}</code>` : m);
            else txt = txt.replace(/\`\`\`(\w{1,15})?\n((?:\n|.)+?)\`\`\`|\`\`(.+?)\`\`(?!\`)|\`([^\`]+?)\`/g, (m, w, x, y, z) => w && x ? `<pre><code class="${w}">${x}</code></pre>` : x ? `<pre><code class="hljs nohighlight">${x}</code></pre>` : y || z ? `<code class="inline">${y || z}</code>` : m);
            if (opts.inEmbed) txt = txt.replace(/\[([^\[\]]+)\]\((.+?)\)/g, `<a title="$1" target="_blank" class="anchor" href="$2">$1</a>`);
            if (opts.replaceEmojis) txt = txt.replace(/(?<!code(?: \w+=".+")?>[^>]+)(?<!\/[^\s"]+?):((?!\/)\w+):/g, (match, x) => x && emojis[x] ? emojis[x] : match);
            txt = txt
                .replace(/(?<=\n|^)\s*>\s+([^\n]+)/g, '<div class="blockquote"><div class="blockquoteDivider"></div><blockquote>$1</blockquote></div>')
                .replace(/\n/g, '<br>');
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
                content.innerHTML = data.content ? markup(data.content, { replaceEmojis: true }) : '';
                if (data.embed) {
                    let e = data.embed;
                    if (!allGood(e)) return;
                    if (e.title) display(embedTitle, markup(`${e.url ? '<a class="anchor" target="_blank" href="' + url(e.url) + '">' + e.title + '</a>' : e.title}`, { replaceEmojis: true, inlineBlock: true }));
                    else hide(embedTitle);
                    if (e.description) display(embedDescription, markup(e.description, { inEmbed: true, replaceEmojis: true }));
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
                                    <div class="embedFieldName">${markup(f.name, { inEmbed: true, replaceEmojis: true, inlineBlock: true })}</div>
                                    <div class="embedFieldValue">${markup(f.value, { inEmbed: true, replaceEmojis: true })}</div>
                                </div>`;
                            } else {
                                el = fields.insertBefore(document.createElement('div'), null);
                                el.outerHTML = `
                                <div class="embedField ${num}" style="grid-column: ${colNum} / ${colNum + 4};">
                                    <div class="embedFieldName">${markup(f.name, { inEmbed: true, replaceEmojis: true, inlineBlock: true })}</div>
                                    <div class="embedFieldValue">${markup(f.value, { inEmbed: true, replaceEmojis: true })}</div>
                                </div>`;
                                colNum = (colNum === 9 ? 1 : colNum + 4);
                                num++;
                            }
                        });
                        colNum = 1;
                        let len = e.fields.filter(f => f.inline).length;
                        if (len === 2 || (len > 3 && len % 2 !== 0)) {
                            let children = Array.from(fields.children), arr = children.filter(x => x === children[len] || x === children[len - 1]);
                            arr[0].style.gridColumn = '1 / 7', arr[1].style.gridColumn = '7 / 13';
                        }
                        display(fields, undefined, 'grid');
                    } else hide(fields);
                    embed.classList.remove('empty');
                    notif.animate({ opacity: '0', bottom: '-50px', offset: 1 }, { easing: 'ease', duration: 500 }).onfinish = () => notif.style.removeProperty('display');
                    twemoji.parse(msgEmbed);
                } else embed.classList.add('empty');
            } catch (e) {
                error(e);
            }
        }

    editor.on('change', editor => {
        try { update(toObj(editor.getValue())); }
        catch (e) {
            if (editor.getValue()) return;
            embed.classList.add('empty');
            content.innerHTML = '';
        }
        document.querySelectorAll('.markup pre > code').forEach((block) => hljs.highlightBlock(block));
    });

    update(toObj(editor.getValue()));
    document.querySelector('.timeText').innerText = tstamp();
    document.querySelectorAll('.markup pre > code').forEach((block) => hljs.highlightBlock(block));
    !window.navigator.userAgent.match(/Firefox\/[\d\.]+$/g) && // Firefox pushes the text up a little
        document.querySelector('.botText').style.removeProperty('top');
};
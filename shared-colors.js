(async function () {
    'use strict';
    const byId = id => document.getElementById(id);
    const panel = byId('sharedPanel');
    const status = byId('sharedStatus');
    const form = byId('colorEditor');
    const fieldset = byId('editorFieldset');
    const editorStatus = byId('editorStatus');
    const rows = byId('editorColors');
    const addButton = byId('addTeam');
    const refreshButton = byId('refreshColors');
    const colorHex = byId('teamDisplayColor');
    const colorPicker = byId('cardColorPicker');
    const colorPalette = byId('cardColorPalette');
    function syncCardColor(value) {
        if (!/^#[0-9a-f]{6}$/i.test(value)) return;
        colorHex.value = value; colorPicker.value = value;
        byId('cardColorPreview').style.backgroundColor = value;
        colorPalette.querySelectorAll('button').forEach(button => {
            const selected = button.dataset.color.toLowerCase() === value.toLowerCase();
            button.setAttribute('aria-pressed', String(selected)); button.textContent = selected ? '✓' : '';
        });
    }
    if (colorPicker && colorPalette) {
        const palette = ['#000000','#444444','#666666','#888888','#aaaaaa','#cccccc','#eeeeee','#ffffff',
            '#f44336','#795000','#d88900','#81c700','#2986cc','#195577','#7030a0','#cc0088'];
        const bases = [[220,40,40],[245,145,30],[230,190,30],[75,160,45],[35,120,135],[40,120,200],[110,70,160],[160,45,95]];
        [0.75,0.5,0.25,0,-0.25,-0.5].forEach(tint => bases.forEach(rgb => {
            palette.push('#' + rgb.map(v => Math.round(tint >= 0 ? v + (255-v)*tint : v*(1+tint)).toString(16).padStart(2,'0')).join(''));
        }));
        palette.forEach(value => {
            const button = document.createElement('button'); button.type = 'button'; button.dataset.color = value;
            button.style.backgroundColor = value; button.setAttribute('aria-label', 'カード色 ' + value);
            button.title = value; button.addEventListener('click', () => syncCardColor(value)); colorPalette.append(button);
        });
        colorPicker.addEventListener('input', () => syncCardColor(colorPicker.value));
        colorHex.addEventListener('input', () => syncCardColor(colorHex.value.trim()));
    }
    let store, records = [], editing = null, loaded = false, reading = false, saving = false;
    const baseCard = createTeamCard;
    createTeamCard = function (team) {
        const card = baseCard(team);
        if (team.id) {
            const button = document.createElement('button');
            button.type = 'button'; button.className = 'edit-team'; button.textContent = '編集';
            button.disabled = saving;
            button.addEventListener('click', () => openEditor(team));
            card.append(button);
        }
        return card;
    };
    function draw() {
        ColorStore.categories.forEach(category => renderGroup(records.filter(r => r.category === category).map(r => ({ ...r, cardColor: r.card_color })), category + 'Grid'));
        colorSearch.dispatchEvent(new Event('input'));
    }
    function addColorRow(color = {}) {
        if (rows.children.length >= 12) return;
        const row = document.createElement('div'); row.className = 'editor-color';
        const values = [color.label || '', color.rgb ? getRgbText(color.rgb) : color.name || '', color.finish || ''];
        ['項目名（メイン・パール等）', 'カラー名・RGB・HEX', '塗装タイプ（任意）'].forEach((labelText, i) => {
            const label = document.createElement('label'); label.textContent = labelText;
            const input = document.createElement(i === 2 ? 'select' : 'input');
            if (i === 2) {
                const finishes = ['', 'クラシック', 'メタリック', 'マット', '金属', 'カメレオン', 'RGBピッカー', 'HEXピッカー'];
                // Keep previously entered custom values when editing existing teams.
                if (values[i] && !finishes.includes(values[i])) finishes.push(values[i]);
                finishes.forEach(value => {
                    const option = document.createElement('option');
                    option.value = value; option.textContent = value || '未指定'; input.append(option);
                });
            } else { input.type = 'text'; input.maxLength = [40, 160][i]; }
            input.required = i < 2; input.value = values[i]; input.dataset.field = ['label', 'value', 'finish'][i];
            label.append(input); row.append(label);
        });
        const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '項目を外す';
        remove.addEventListener('click', () => row.remove()); row.append(remove); rows.append(row);
    }
    function openEditor(team = null) {
        if (saving || !loaded || (!form.hidden && !confirm('編集中の入力を閉じて、別の編集を始めますか？'))) return;
        editing = team ? { id: team.id, version: team.version } : null;
        byId('editorTitle').textContent = team ? 'カラーを編集' : 'カラーを追加';
        byId('teamCategory').value = team?.category || 'gang';
        byId('teamName').value = team?.name || '';
        byId('teamDisplayColor').value = team?.card_color || '#8c299c';
        if (colorPicker) syncCardColor(byId('teamDisplayColor').value);
        rows.replaceChildren(); (team?.colors || [{ label: 'メイン' }]).forEach(addColorRow);
        editorStatus.textContent = ''; form.hidden = false;
        byId('teamName').focus(); form.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
    async function refresh(manual = false) {
        if (!store || reading || saving) return;
        reading = true; refreshButton.disabled = true;
        try {
            const data = await store.list();
            // Validate the complete snapshot before replacing the last good view.
            data.forEach(ColorStore.validate);
            records = data; loaded = true; draw(); addButton.disabled = false;
            status.textContent = '共有済み · ' + new Date().toLocaleTimeString('ja-JP') + ' 時点（15秒ごとに更新）';
        } catch (error) {
            status.textContent = loaded ? '更新を取得できません。直前の一覧を表示しています。「一覧を更新」で再試行できます。' : error.message;
        } finally { reading = false; refreshButton.disabled = false; }
    }
    addButton.addEventListener('click', () => openEditor());
    refreshButton.addEventListener('click', () => refresh(true));
    byId('addColorRow').addEventListener('click', () => addColorRow());
    byId('cancelColorEdit').addEventListener('click', () => { if (!saving) form.hidden = true; });
    form.addEventListener('submit', async event => {
        event.preventDefault(); if (saving || !store) return;
        try {
            const team = ColorStore.validate({ category: byId('teamCategory').value, name: byId('teamName').value,
                card_color: byId('teamDisplayColor').value.trim(), colors: Array.from(rows.children, row => ({
                    label: row.querySelector('[data-field="label"]').value,
                    ...ColorStore.parseColor(row.querySelector('[data-field="value"]').value),
                    finish: row.querySelector('[data-field="finish"]').value.trim()
                })) });
            saving = true; fieldset.disabled = true; addButton.disabled = true;
            document.querySelectorAll('.edit-team').forEach(button => button.disabled = true);
            editorStatus.textContent = '共有保存中…';
            const result = await store.save(team, editing?.id ?? null, editing?.version ?? null);
            // A received success is required before closing the draft.
            editing = { id: result.id, version: result.version };
            form.hidden = true; status.textContent = '全員が見られるように保存しました。';
        } catch (error) { editorStatus.textContent = error.message + ' 入力内容は残っています。'; }
        finally {
            saving = false; fieldset.disabled = false; addButton.disabled = !loaded;
            document.querySelectorAll('.edit-team').forEach(button => button.disabled = false);
        }
        if (form.hidden) await refresh();
    });
    window.addEventListener('beforeunload', event => { if (!form.hidden) { event.preventDefault(); event.returnValue = ''; } });
    try { store = new ColorStore.Store(window.COLOR_STORAGE); }
    catch (error) { status.textContent = error.message; refreshButton.disabled = true; return; }
    await refresh();
    setInterval(() => { if (!document.hidden) refresh(); }, 15000);
    window.addEventListener('online', () => refresh());
    document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
})();

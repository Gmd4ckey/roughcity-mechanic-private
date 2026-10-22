(function (root) {
    'use strict';
    const categories = ['gang', 'hangure', 'veteran', 'doctor', 'cartel'];
    function text(value, max, required = true) {
        if (typeof value !== 'string' || value.length > max || (required && !value.trim())) {
            throw new Error('入力内容と文字数を確認してください。');
        }
        return value.trim();
    }
    function parseColor(value) {
        value = text(value, 160);
        if (/^#[0-9a-f]{6}$/i.test(value)) {
            return { rgb: [1, 3, 5].map(i => parseInt(value.slice(i, i + 2), 16)) };
        }
        const match = value.match(/^(?:rgb\(\s*)?(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)?$/i);
        if (match) {
            const rgb = match.slice(1).map(Number);
            if (rgb.some(v => v > 255)) throw new Error('RGBは0〜255で入力してください。');
            return { rgb };
        }
        return { name: value };
    }
    function validate(team) {
        if (!categories.includes(team.category)) throw new Error('分類を選択してください。');
        const name = text(team.name, 80);
        if (!/^#[0-9a-f]{6}$/i.test(team.card_color)) throw new Error('表示色は#から始まる6桁のHEXで入力してください。');
        if (!Array.isArray(team.colors) || !team.colors.length || team.colors.length > 12) throw new Error('カラー項目は1〜12件で入力してください。');
        const colors = team.colors.map(c => {
            const out = { label: text(c.label, 40) };
            if (c.rgb) {
                if (!Array.isArray(c.rgb) || c.rgb.length !== 3 || c.rgb.some(v => !Number.isInteger(v) || v < 0 || v > 255)) throw new Error('RGBは0〜255の整数を3つ入力してください。');
                out.rgb = c.rgb;
            } else out.name = text(c.name, 160);
            if (c.finish) out.finish = text(c.finish, 40);
            return out;
        });
        return { category: team.category, name, card_color: team.card_color, colors };
    }
    class Store {
        constructor(config, fetcher = root.fetch.bind(root)) {
            if (!config || !/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.url) || !/^sb_publishable_[A-Za-z0-9_-]+$/.test(config.publishableKey)) {
                throw new Error('共有保存先はまだ設定されていません。現在は既存カラーの閲覧のみ可能です。');
            }
            this.config = config;
            this.fetcher = fetcher;
        }
        async request(path, body) {
            const response = await this.fetcher(this.config.url + '/rest/v1/' + path, {
                method: body ? 'POST' : 'GET',
                headers: { apikey: this.config.publishableKey, 'Content-Type': 'application/json' },
                body: body ? JSON.stringify(body) : undefined,
                signal: AbortSignal.timeout(12000), cache: 'no-store'
            });
            if (!response.ok) {
                const error = await response.json().catch(() => ({}));
                if (error.message === 'edit_conflict') throw new Error('別の人が先に更新しました。入力内容を控えて一覧を更新し、編集し直してください。');
                if (error.message === 'write_limit') throw new Error('更新が集中しています。1分ほど待って再度保存してください。');
                if (error.message === 'color_limit') throw new Error('チーム数が上限の300件に達しました。既存チームを編集してください。');
                throw new Error('共有保存先に接続できませんでした。設定または通信状態を確認して再試行してください。');
            }
            return response.json();
        }
        list() { return this.request('shared_colors?select=id,category,name,card_color,colors,version&order=created_at.asc,id.asc&limit=300'); }
        save(team, id = null, version = null) {
            const value = validate(team);
            return this.request('rpc/save_shared_color', { p_id: id, p_version: version, p_category: value.category, p_name: value.name, p_card_color: value.card_color, p_colors: value.colors });
        }
    }
    const api = { Store, validate, parseColor, categories };
    root.ColorStore = api;
    if (typeof module !== 'undefined') module.exports = api;
})(typeof window === 'undefined' ? globalThis : window);

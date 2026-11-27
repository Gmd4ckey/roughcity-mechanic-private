// ==========================================
// ラフシティメカニック
// script.js
// ==========================================


// ==========================================
// HTML要素
// ==========================================

const totalPrice =
    document.getElementById("totalPrice");

const copyButton =
    document.getElementById("copyButton");

const completePaymentButton =
    document.getElementById("completePaymentButton");

const resetButton =
    document.getElementById("resetButton");

    const HISTORY_STORAGE_KEY = "mechanicPaymentHistory";
const MAX_HISTORY_COUNT = 30;

const themeButton =
    document.getElementById("themeButton");


const orderInput =
    document.getElementById("orderInput");

const orderSummary =
    document.getElementById("orderSummary");

const orderResult =
    document.getElementById("orderResult");

const analyzeButton =
    document.getElementById("analyzeButton");


const exteriorCount =
    document.getElementById("exteriorCount");

const colorCount =
    document.getElementById("colorCount");


const citizenExteriorCount = document.getElementById('citizenExteriorCount');
const citizenColorCount = document.getElementById('citizenColorCount');
createCountOptions(citizenExteriorCount,50);
createCountOptions(citizenColorCount,20);
[citizenExteriorCount,citizenColorCount].forEach(select=>select.addEventListener('change',()=>{calculateTotal();saveMechanicState();}));

const performanceCitizenDiscount = document.getElementById('performanceCitizenDiscount');
performanceCitizenDiscount.addEventListener('change',()=>{calculateTotal();saveMechanicState();});
const performanceItemKey = item => (item.name || 'extra') + ':' + item.closest('label').querySelector('.option-name').textContent.trim();
const priceItems =
    document.querySelectorAll(".price-item");

const radioItems =
    document.querySelectorAll(
        'input[type="radio"].price-item'
    );

const saleQuantities =
    document.querySelectorAll(".sale-quantity");
const repairQuantities =
    document.querySelectorAll(".repair-quantity");

// ==========================================
// localStorage
// ==========================================

const MECHANIC_STORAGE_KEY =
    "roughCityMechanicStateV1";


// ==========================================
// 外装 / カラー選択肢
// ==========================================

function createCountOptions(select, max) {

    select.innerHTML = "";

    for (let i = 0; i <= max; i++) {

        const option =
            document.createElement("option");

        option.value =
            String(i);

        option.textContent =
            `${i}か所`;

        select.appendChild(option);
    }
}


createCountOptions(
    exteriorCount,
    50
);

createCountOptions(
    colorCount,
    20
);


// ==========================================
// CATEGORY表示順
// SUMMARY / DETAIL LIST共通
// ==========================================

const categoryOrder = {

    "バンパー": 10,

    "スカート": 20,

    "ボンネット": 30,

    "屋根": 40,

    "排気口": 50,

    "スポイラー": 60,

    "シートカラー": 70,

    "カスタムホイール": 80,

    "内装カスタム": 90,

    "外装カスタム": 100,

    "ロールケージ": 110,

    "ナンバープレート": 120,

    "カラー": 130,

    "フィルムキット": 140,

    "リバリー": 150,

    "クラクション": 160,

    "ヘッドライト": 170,

    "アンダーネオン": 180,

    "タイヤスモーク": 190,

    "ニトロパージ": 200,

    "エクストラ": 210,

    // 未登録は必ず最後
    "その他": 9999
};


// ==========================================
// DETAIL LIST NAME表示順
// ==========================================

const nameOrder = {

    // バンパー

    "リアバンパー": 10,

    "フロントバンパー": 20,

    "グリル": 30,


    // スカート

    "左フェンダー": 40,

    "右フェンダー": 50,

    "右フェンダー（バニティホルダー）": 60,

    "サイドスカート": 70,

    "スカート": 80,


    // ボンネット

    "ボンネット": 90,

    "フード": 100,


    // 屋根

    "ルーフ": 110,


    // 排気

    "マフラー": 120,


    // スポイラー

    "スポイラー": 130,


    // シート

    "シート": 140,


    // ホイール本体

    "フロントホイール": 150,
    "リアホイール": 151,

    "ホイールリム": 160,

    "ホイールリム（バイク用）": 170,


    // 内装

    "ドアスピーカー": 180,

    "ダイヤル": 190,

    "ステアリングホイール": 200,


    // 外装

    "トリムA": 210,

    "トリムB": 220,

    "アンテナ": 230,

    "アーチカバー": 240,

    "エンジンブロック": 250,

    "フィルター": 260,

    "ストラットタワーバー": 270,

    "トランク": 280,

    "突力装置": 290,

    "燃料タンク": 300,

    "エクストラパーツ": 310,


    // ロールケージ

    "ロールケージ": 320,


    // ナンバープレート

    "バニティプレート": 330,

    "カスタムプレート": 340,

    "ナンバープレートホルダー": 350,

    "ナンバープレート": 360,


    // カラー

    "ダッシュボード": 370,

    "メインカラー": 380,

    "プライマリ": 390,

    "サブカラー": 400,

    "セカンダリー": 410,

    "パール": 420,

    "パールセント": 430,

    "ホイール": 440,

    "ホイールカラー": 450,

    "内装": 460,

    "インテリア": 470,


    // フィルム

    "ウィンドウの色合い": 480,

    "ガラススモーク": 490,


    // リバリー

    "ラッピング": 500,

    "リバリー": 510,


    // クラクション

    "クラクション": 520,


    // ヘッドライト

    "ヘッドライト兼アンダーライト": 530,

    "ヘッドライト": 540,


    // アンダーネオン

    "アンダーカラー変更": 550,

    "アンダーネオンカラー": 560,


    // タイヤスモーク

    "タイヤスモーク": 570,


    // ニトロパージ

    "ニトロ冷却噴射時カラー": 580,

    "ニトロパージコントロール": 590
};


// ==========================================
// 合計金額
// ==========================================

// One set of line items drives both the total and the breakdown.
function getBillingLines() {
    const lines = [];
    const add = (name, quantity, price, group, key) => {
        if (quantity > 0) lines.push({name, quantity, price, group, key, subtotal: quantity * price});
    };
    repairQuantities.forEach(input => add(
        input.closest('.repair-item').querySelector('strong').textContent.trim(),
        Math.max(0, Number(input.value) || 0), Number(input.dataset.price), '修理・補充', 'repair'));
    priceItems.forEach(item => {
        if (!item.checked) return;
        const option = item.closest('label').querySelector('.option-name').textContent.trim();
        const part = item.closest('.performance-row')?.querySelector('.part-name').textContent.trim();
        add(part ? part + ' ' + option : option, 1, Number(item.dataset.price), '性能カスタム', item.name || option);
    });
    if (performanceCitizenDiscount.checked) {
        const performanceTotal = lines.filter(line=>line.group==='性能カスタム').reduce((sum,line)=>sum+line.subtotal,0);
        if(performanceTotal>0) add('白市民割引（性能カスタム20％）',1,-Math.round(performanceTotal/5),'性能カスタム','performanceDiscount');
    }
    add('外装カスタム', Number(exteriorCount.value), 800000, '外装・カラー', 'exterior');
    add('カラー', Number(colorCount.value), 200000, '外装・カラー', 'color');
    add('白市民外装カスタム', Number(citizenExteriorCount.value), 640000, '外装・カラー', 'citizenExterior');
    add('白市民カラー', Number(citizenColorCount.value), 160000, '外装・カラー', 'citizenColor');
    saleQuantities.forEach(input => add(
        input.closest('.sales-item').querySelector('strong').textContent.trim(),
        Math.max(0, Number(input.value) || 0), Number(input.dataset.price), '販売', 'sale'));
    return lines;
}

function yen(value) { return '¥' + value.toLocaleString('ja-JP'); }

function renderBillingBreakdown(lines, total) {
    const content = document.getElementById('breakdownContent');
    content.replaceChildren();
    if (!lines.length) {
        const empty = document.createElement('p');
        empty.className = 'empty-message';
        empty.textContent = '項目を選ぶと、ここに料金内訳が表示されます。';
        content.append(empty);
    } else {
        const table = document.createElement('table');
        table.className = 'billing-table';
        const head = table.createTHead().insertRow();
        ['項目', '数量', '単価', '小計'].forEach(text => {
            const th = document.createElement('th'); th.scope = 'col'; th.textContent = text; head.append(th);
        });
        const body = table.createTBody();
        lines.forEach(line => {
            const row = body.insertRow();
            const name = row.insertCell();
            const group = document.createElement('small'); group.textContent = line.group;
            const label = document.createElement('span'); label.textContent = line.name;
            name.append(group, label);
            [line.quantity, yen(line.price), yen(line.subtotal)].forEach(text => { row.insertCell().textContent = text; });
        });
        content.append(table);
    }
    document.getElementById('breakdownTotal').textContent = yen(total);
}

function getDuplicateWarnings(lines, items) {
    const warnings = [];
    const fullOptions = lines.filter(line => ['フルカスタム', '白市民フルカスタム', 'フルカス アーマーなし', '白市民フルカス アーマーなし'].includes(line.name));
    for (const full of fullOptions) {
        const included = ['engine', 'transmission', 'brake', 'oilpump', 'driveshaft', 'cylinder', 'battery', 'fuel', 'アーマー', 'ターボ'];
        const overlaps = lines.filter(line => line.group === '性能カスタム' && included.includes(line.key) && !(full.name.includes('アーマーなし') && line.key === 'アーマー'));
        if (overlaps.length) warnings.push(full.name + 'に含まれる項目も個別に選択されています：' + overlaps.map(line => line.name).join('、'));
        if (full.quantity > 1) warnings.push(full.name + 'の数量が ' + full.quantity + ' です。台数をご確認ください。');
    }
    if (fullOptions.length > 1) warnings.push('フルカスタムのプランが複数入力されています。台数・対象をご確認ください。');
    const counts = new Map();
    items.forEach(item => {
        const key = item.category + '\u0000' + item.name;
        const entry = counts.get(key) || {name: item.name, count: 0};
        entry.count++; counts.set(key, entry);
    });
    const repeats = [...counts.values()].filter(item => item.count > 1);
    if (repeats.length) warnings.push('注文内に同じ項目が複数あります：' + repeats.map(item => item.name + '（' + item.count + '件）').join('、'));
    return warnings;
}

function updateDuplicateNotice(lines = getBillingLines()) {
    const notice = document.getElementById('duplicateNotice');
    const warnings = getDuplicateWarnings(lines, parseOrder(orderInput.value));
    notice.hidden = warnings.length === 0;
    notice.replaceChildren();
    if (!warnings.length) return;
    const title = document.createElement('strong'); title.textContent = '重複の可能性があります';
    const list = document.createElement('ul');
    warnings.forEach(text => { const li = document.createElement('li'); li.textContent = text; list.append(li); });
    const help = document.createElement('p'); help.textContent = '自動で除外・減額はしていません。注文内容と選択項目をご確認ください。';
    notice.append(title, list, help);
}

function calculateTotal() {
    const lines = getBillingLines();
    const total = lines.reduce((sum, line) => sum + line.subtotal, 0);
    totalPrice.textContent = yen(total);
    renderBillingBreakdown(lines, total);
    updateDuplicateNotice(lines);
}

// ==========================================
// 修理
// ==========================================

repairQuantities.forEach((input) => {

    input.addEventListener(
        "input",
        () => {

            if (
                Number(input.value) < 0
            ) {

                input.value = "0";

            }

            calculateTotal();

            saveMechanicState();

        }
    );

});

// ==========================================
// 状態保存
// ==========================================

function saveMechanicState() {

    const state = {
        performanceCitizenDiscount: performanceCitizenDiscount.checked,
        citizenExteriorCount: citizenExteriorCount.value,
        citizenColorCount: citizenColorCount.value,

        orderInput:
            orderInput.value,

        exteriorCount:
            exteriorCount.value,

        colorCount:
            colorCount.value,

        priceItems:
            Array.from(priceItems).map(
                (item) => {

                    return {
                        key: performanceItemKey(item),
                        checked:
                            item.checked
                    };
                }
            ),

        saleQuantities:
            Array.from(saleQuantities).map(
                (input) => {

                    return {
                        value:
                            input.value
                    };
                }
            ),

        repairQuantities:
            Array.from(repairQuantities).map(
                (input) => {

                    return {
                        value:
                            input.value
                    };
                }
            )
    };


    try {

        localStorage.setItem(
            MECHANIC_STORAGE_KEY,
            JSON.stringify(state)
        );

    } catch (error) {

        console.error(
            "メカニック状態の保存に失敗しました。",
            error
        );
    }
}


// ==========================================
// カラー項目判定
// ==========================================

function isColorItem(name, detail) {

    const colorNames = [

        "メインカラー",

        "サブカラー",

        "プライマリ",

        "セカンダリー",

        "パール",

        "パールセント",

        "ホイールカラー",

        "インテリア",

        "内装"
    ];


    if (
        colorNames.includes(name)
    ) {

        return true;
    }


    // Wheelsはホイール本体
    // ホイールはカラー

    if (
        name === "ホイール"
    ) {

        return true;
    }


    // ダッシュボードは
    // パーツ変更とカラー変更が存在

    if (
        name === "ダッシュボード"
    ) {

        const colorWords =
            /メタリック|マット|クローム|金属|パール|カラー|ブラック|ホワイト|レッド|ブルー|グリーン|イエロー|オレンジ|パープル|ピンク|シルバー|ゴールド|グレー/i;


        if (
            colorWords.test(detail)
        ) {

            return true;
        }
    }


    return false;
}


// ==========================================
// カテゴリ判定
// ==========================================

function getCategory(name, detail) {


    // カラー

    if (
        isColorItem(name, detail)
    ) {

        return "カラー";
    }


    // バンパー

    if (
        name === "リアバンパー" ||
        name === "フロントバンパー" ||
        name === "グリル"
    ) {

        return "バンパー";
    }


    // スカート

    if (
        name === "左フェンダー" ||
        name === "右フェンダー" ||
        name === "右フェンダー（バニティホルダー）" ||
        name === "サイドスカート" ||
        name === "スカート"
    ) {

        return "スカート";
    }


    // ボンネット

    if (
        name === "ボンネット" ||
        name === "フード"
    ) {

        return "ボンネット";
    }


    // 屋根

    if (
        name === "ルーフ"
    ) {

        return "ルーフ";
    }


    // 排気口

    if (
        name === "マフラー"
    ) {

        return "マフラー";
    }


    // スポイラー

    if (
        name === "スポイラー"
    ) {

        return "スポイラー";
    }


    // シート

    if (
        name === "シート"
    ) {

        return "シートカラー";
    }


    // カスタムホイール

    if (
        name === "フロントホイール" ||
        name === "リアホイール" ||
        name === "ホイールリム" ||
        name === "ホイールリム（バイク用）"
    ) {

        return "カスタムホイール";
    }

// ======================================
// 内装
// ======================================

if (
    name === "ドアスピーカー" ||
    name === "ダッシュボード" ||
    name === "ダイヤル" ||
    name === "ステアリングホイール" ||
    name === "メーター" ||
    name === "オーナメント" ||
    name === "プレート" ||
    name === "シフトレバー" ||
    name === "スピーカー"
) {

    return "内装カスタム";
}

const exteriorNames = [

    "トリムA",

    "トリムB",

    "アンテナ",

    "アーチカバー",

    "エンジンブロック",

    "フィルター",

    "ストラットタワーバー",

    "エアフィルター",

    "エンジンストラット",

    "トランク",

    "突力装置",

    "燃料タンク",

    "エクストラパーツ"
];
// ======================================
// エクストラ
// ======================================

if (
    name === "エクストラ"
) {

    return "エクストラ";
}
    if (
        exteriorNames.includes(name)
    ) {

        return "外装カスタム";
    }


    // ロールケージ

    if (
        name === "ロールケージ"
    ) {

        return "ロールケージ";
    }


    // ナンバープレート

    if (
        name === "バニティプレート" ||
        name === "カスタムプレート" ||
        name === "ナンバープレートホルダー" ||
        name === "ナンバープレート"
    ) {

        return "ナンバープレート";
    }


    // フィルムキット

    if (
        name === "ウィンドウの色合い" ||
        name === "ガラススモーク"
    ) {

        return "フィルムキット";
    }


    // リバリー

    if (
        name === "ラッピング" ||
        name === "リバリー"
    ) {

        return "リバリー";
    }


    // クラクション

    if (
        name === "クラクション"
    ) {

        return "クラクション";
    }


    // ヘッドライト

    if (
        name === "ヘッドライト兼アンダーライト" ||
        name === "ヘッドライト"
    ) {

        return "ヘッドライト";
    }


    // アンダーネオン

    if (
        name === "アンダーカラー変更" ||
        name === "アンダーネオンカラー"
    ) {

        return "アンダーネオン";
    }


    // タイヤスモーク

    if (
        name === "タイヤスモーク"
    ) {

        return "タイヤスモーク";
    }


    // ニトロパージ

    if (
        name === "ニトロ冷却噴射時カラー" ||
        name === "ニトロパージコントロール"
    ) {

        return "ニトロパージ";
    }


    // 未登録

    return "その他";
}


// ==========================================
// オーダーシート解析
// ==========================================

function normalizeOrderName(name) {
    if (/^戻る\s*Wheels?$/i.test(name)) return "リアホイール";
    if (/^Wheels?$/i.test(name)) return "フロントホイール";
    return name;
}

function parseOrder(text) {

    const result = [];


    const regex =
        /([^,\[\]]+?)\s*-\s*\[\s*([^\]]*?)\s*\](?:,|$)/g;


    let match;


    while (
        (
            match =
                regex.exec(text)
        ) !== null
    ) {

        const name = normalizeOrderName(match[1].trim());


        const detail =
            match[2]
                .trim();


        if (!name) {

            continue;
        }


        result.push({

            category:
                getCategory(
                    name,
                    detail
                ),

            name,

            detail
        });
    }


    return result;
}


// ==========================================
// SUMMARY
// ==========================================

function sortOrderItems(items) {
    return [...items].sort((a, b) => (nameOrder[a.name] ?? 9999) - (nameOrder[b.name] ?? 9999));
}

function renderSummary(items) {

    const counts = {};


    items.forEach((item) => {

        counts[
            item.category
        ] =
            (
                counts[
                    item.category
                ] || 0
            ) + 1;
    });


    // Match the first appearance of each category in the detail list.
    const sortedCategories = [...new Set(sortOrderItems(items).map(item => item.category))]
        .map(category => [category, counts[category]]);

    let html = `

        <table class="summary-table">

            <thead>

                <tr>

                    <th>
                        PARTS NAME
                    </th>

                    <th>
                        QTY
                    </th>

                </tr>

            </thead>

            <tbody>

    `;


    sortedCategories.forEach(
        ([category, qty]) => {

            html += `

                <tr>

                    <td>
                        ${category}
                    </td>

                    <td>

                        <span class="qty-badge">
                            ${qty}
                        </span>

                    </td>

                </tr>

            `;
        }
    );


    html += `

            </tbody>

        </table>

    `;


    orderSummary.innerHTML =
        html;
}


// ==========================================
// DETAIL LIST
// ==========================================

// Metallic/classic menu numbers supplied in the color reference images.
const orderPaintNames = [
    "ブラック",
    "カーボンブラック",
    "グラファイト",
    "アンスラサイトブラック",
    "ブラックスチール",
    "ダークスチール",
    "シルバー",
    "青みがかったシルバー",
    "ロールドスチール",
    "シャドウシルバー",
    "ストーンシルバー",
    "ミッドナイトシルバー",
    "鋳鉄シルバー",
    "レッド",
    "トリノレッド",
    "フォーミュラレッド",
    "ラバレッド",
    "ブレイズレッド",
    "グレースレッド",
    "ガーネットレッド",
    "サンセットレッド",
    "カベルネレッド",
    "ワインレッド",
    "キャンディレッド",
    "ホットピンク",
    "フィスター・ピンク",
    "サーモンピンク",
    "サンライズオレンジ",
    "オレンジ",
    "ブライトオレンジ",
    "ゴールド",
    "ブロンズ",
    "イエロー",
    "レースイエロー",
    "デューイエロー",
    "ダークグリーン",
    "レーシンググリーン",
    "シーグリーン",
    "オリーブグリーン",
    "ブライトグリーン",
    "ガソリン・グリーン",
    "ライムグリーン",
    "ミッドナイトブルー",
    "ギャラクシーブルー",
    "ダークブルー",
    "サクソンブルー",
    "ブルー",
    "マリナーブルー",
    "ハーバーブルー",
    "ダイヤモンドブルー",
    "サーフブルー",
    "ノーティカルブルー",
    "レーシングブルー",
    "ウルトラブルー",
    "ライトブルー",
    "チョコレートブラウン",
    "バイソンブラウン",
    "クリーンブラウン",
    "フェルツァーブラウン",
    "メイプルブラウン",
    "ビーチウッドブラウン",
    "シエンナブラウン",
    "サドルブラウン",
    "モスブラウン",
    "ウッドビーチブラウン",
    "ストローブラウン",
    "サンディブラウン",
    "ブリーチドブラウン",
    "シャフターパープル",
    "スピネーカーパープル",
    "ミッドナイトパープル",
    "ブライトパープル",
    "クリーム",
    "アイスホワイト",
    "フロストホワイト"
];
const normalizePaintName = value => value.normalize('NFKC').replace(/[\s・･]/g, '');
const orderPaintNumbers = new Map(orderPaintNames.map((name, index) => [normalizePaintName(name), index + 1]));

// Matte uses its own menu numbering, separate from metallic/classic.
const orderMatteNames = ['ブラック','グレー','ライトグレー','アイスホワイト','ブルー','ダークブルー','ミッドナイトブルー','ミッドナイトパープル','シャフターパープル','レッド','ダークレッド','オレンジ','イエロー','ライムグリーン','グリーン','フォレストグリーン','フォリッジグリーン','オリーブドラブ','ダークアース','デザートタン'];
const orderMatteNumbers = new Map(orderMatteNames.map((name,index)=>[normalizePaintName(name),index+1]));

const orderChromeNames = ['ブラッシュドスチール','ブラッシュドブラックスチール','ブラッシュドアルミニウム','ピュアゴールド','ブラッシュドゴールド','クローム'];
const orderChromeNumbers = new Map(orderChromeNames.map((name,index)=>[normalizePaintName(name),index+1]));

const orderChameleonNames = [
    "アノダイズドレッド",
    "アノダイズドワイン",
    "アノダイズドパープル",
    "アノダイズドブルー",
    "アノダイズドグリーン",
    "アノダイズドライム",
    "アノダイズドカッパー",
    "アノダイズドブロンズ",
    "アノダイズドシャンパン",
    "アノダイズドゴールド",
    "グリーン/ブルー フリップ",
    "グリーン/レッド フリップ",
    "グリーン/ブラウン フリップ",
    "グリーン/ターコイズ フリップ",
    "グリーン/パープル フリップ",
    "ティール/パープル フリップ",
    "ターコイズ/レッド フリップ",
    "ターコイズ/パープル フリップ",
    "シアン/パープル フリップ",
    "ブルー/ピンク フリップ",
    "ブルー/グリーン フリップ",
    "パープル/レッド フリップ",
    "パープル/グリーン フリップ",
    "マゼンタ/グリーン フリップ",
    "マゼンタ/イエロー フリップ",
    "バーガンディ/グリーン フリップ",
    "マゼンタ/シアン フリップ",
    "カッパー/パープル フリップ",
    "マゼンタ/オレンジ フリップ",
    "レッド/オレンジ フリップ",
    "オレンジ/パープル フリップ",
    "オレンジ/ブルー フリップ",
    "ホワイト/パープル フリップ",
    "レッド/レインボー フリップ",
    "ブルー/レインボー フリップ",
    "ダークグリーンパール",
    "ダークティールパール",
    "ダークブルーパール",
    "ダークパープルパール",
    "オイルスリックパール",
    "ライトグリーンパール",
    "ライトブルーパール",
    "ライトパープルパール",
    "ライトピンクパール",
    "オフホワイトパール",
    "ピンクパール",
    "イエローパール",
    "グリーンパール",
    "ブルーパール",
    "クリームパール",
    "ホワイトプリズマティック",
    "グラファイトプリズマティック",
    "ダークブループリズマティック",
    "ダークパープルプリズマティック",
    "ホットピンクプリズマティック",
    "ダークレッドプリズマティック",
    "ダークグリーンプリズマティック",
    "ブラックプリズマティック",
    "ブラック・オイルスピル",
    "ブラック・レインボー",
    "ブラック・ホログラフィック",
    "ホワイト・ホログラフィック",
    "モノクローム",
    "ナイト／デイ",
    "フェーリエル2",
    "スプランク・エクストリーム",
    "バイスシティ",
    "シンセウェーブ",
    "フォーシーズンズ",
    "メゾネット9 スローバック",
    "バブルガム",
    "フルレインボー",
    "サンセット",
    "ザ・セブン",
    "仮面ライダー",
    "クローム・アバレーション",
    "クリスマスだよ",
    "気温",
    "ハオ・スペシャルワークス",
    "エレクトロ",
    "モニカ",
    "フブキ"
];
const orderChameleonNumbers = new Map(orderChameleonNames.map((name,index)=>[normalizePaintName(name),index+1]));

function formatOrderColorDetail(item) {
    if (item.category !== 'カラー') return item.detail;
    const detail = item.detail;
    const finish = /[（(【\[]\s*(メタリック|クラシック|マット|クローム|金属|カメレオン)\s*[）)】\]]/g;
    const match = finish.exec(detail);
    let colorName = detail.replace(finish, '').trim();
    if (/^\d+\s*[.．・:：\-]/.test(colorName)) return detail;
    const normalized = normalizePaintName(colorName);
    let number;
    if (match?.[1] === 'マット' || (!match && normalized.startsWith('マット'))) {
        number = orderMatteNumbers.get(normalized.replace(/^マット/, ''));
    } else if (match?.[1] === 'クローム' || match?.[1] === '金属' || (!match && orderChromeNumbers.has(normalized))) {
        number = orderChromeNumbers.get(normalized);
    } else if (match?.[1] === 'カメレオン' || (!match && orderChameleonNumbers.has(normalized))) {
        number = orderChameleonNumbers.get(normalized);
    } else if (match) {
        number = orderPaintNumbers.get(normalized);
    }
    return number ? number + '. ' + detail : detail;
}

function renderDetails(items) {

    const sortedItems = sortOrderItems(items);

    let html = `

        <table class="detail-table">

            <thead>

                <tr>

                    <th>
                        CATEGORY
                    </th>

                    <th>
                        NAME
                    </th>

                    <th>
                        DETAIL
                    </th>

                </tr>

            </thead>

            <tbody>

    `;


    sortedItems.forEach(
        (item) => {

            html += `

                <tr>

                    <td>
                        ${item.category}
                    </td>

                    <td>
                        ${item.name}
                    </td>

                    <td>
                        ${formatOrderColorDetail(item)}
                    </td>

                </tr>

            `;
        }
    );


    html += `

            </tbody>

        </table>

    `;


    orderResult.innerHTML =
        html;
}


// ==========================================
// 外装 / カラー自動カウント
// ==========================================

function updateCustomCounts(items) {

    let exterior = 0;

    let colors = 0;


    items.forEach((item) => {

        if (
            item.category ===
            "カラー"
        ) {

            colors++;

        } else {

            // カラー以外を外装の件数として集計

            exterior++;
        }
    });


    exteriorCount.value =
        String(
            Math.min(
                exterior,
                50
            )
        );


    colorCount.value =
        String(
            Math.min(
                colors,
                20
            )
        );


    calculateTotal();
}


// ==========================================
// 保存状態を復元
// ==========================================

function restoreMechanicState() {

    const saved =
        localStorage.getItem(
            MECHANIC_STORAGE_KEY
        );


    if (!saved) {

        calculateTotal();

        return;
    }


    try {

        const state =
            JSON.parse(saved);


        // オーダーシート

        if (
            typeof state.orderInput ===
            "string"
        ) {

            orderInput.value =
                state.orderInput;
        }


        performanceCitizenDiscount.checked = state.performanceCitizenDiscount === true;
        const savedPerformance = Array.isArray(state.priceItems) ? state.priceItems.slice() : [];
        if(savedPerformance.length && !savedPerformance.some(item=>item?.key)){
            // Remove the former nitro slots without shifting harness and later selections.
            savedPerformance.splice(36,1);
            savedPerformance.splice(35,1);
        }
        // 性能カスタム

        if (
            Array.isArray(
                state.priceItems
            )
        ) {

            priceItems.forEach(
                (item, index) => {

                    const savedItem =
                        savedPerformance.some(entry=>entry?.key) ? savedPerformance.find(entry=>entry.key===performanceItemKey(item)) : savedPerformance[index];


                    if (
                        savedItem
                    ) {

                        item.checked =
                            Boolean(
                                savedItem.checked
                            );
                    }
                }
            );
        }


        citizenExteriorCount.value = String(Math.min(50,Math.max(0,Math.floor(Number(state.citizenExteriorCount)||0))));
        citizenColorCount.value = String(Math.min(20,Math.max(0,Math.floor(Number(state.citizenColorCount)||0))));

        // 外装

        if (
            state.exteriorCount !==
            undefined
        ) {

            exteriorCount.value =
                String(
                    state.exteriorCount
                );
        }


        // カラー

        if (
            state.colorCount !==
            undefined
        ) {

            colorCount.value =
                String(
                    state.colorCount
                );
        }


        // 販売

        if (
            Array.isArray(
                state.saleQuantities
            )
        ) {

            saleQuantities.forEach(
                (input, index) => {

                    const savedInput =
                        state.saleQuantities[index];


                    if (
                        savedInput
                    ) {

                        input.value =
                            savedInput.value ?? "0";
                    }
                }
            );
        }
// 修理

if (
    Array.isArray(
        state.repairQuantities
    )
) {

    // Older saved orders have six repair fields; retain full custom at its new position.
    const savedRepairs = state.repairQuantities.slice();
    if (savedRepairs.length === 6) savedRepairs.splice(5, 0, {value: "0"});
    repairQuantities.forEach(
        (input, index) => {

            const savedInput =
                savedRepairs[index];

            if (
                savedInput
            ) {

                input.value =
                    savedInput.value ?? "0";
            }
        }
    );
}

        // SUMMARY / DETAIL LIST

        const text =
            orderInput.value
                .trim();


        if (text) {

            const items =
                parseOrder(text);


            if (
                items.length > 0
            ) {

                renderSummary(items);

                renderDetails(items);
            }
        }


        calculateTotal();

    } catch (error) {

        console.error(
            "メカニック状態の復元に失敗しました。",
            error
        );


        localStorage.removeItem(
            MECHANIC_STORAGE_KEY
        );


        calculateTotal();
    }
}


// ==========================================
// 性能カスタム
// ==========================================

radioItems.forEach((radio) => {

    let wasChecked = false;


    radio.addEventListener(
        "mousedown",
        () => {

            wasChecked =
                radio.checked;
        }
    );


    radio.addEventListener(
        "click",
        () => {

            if (
                wasChecked
            ) {

                radio.checked =
                    false;
            }


            calculateTotal();

            saveMechanicState();
        }
    );
});


// ==========================================
// その他性能
// ==========================================

document
    .querySelectorAll(
        'input[type="checkbox"].price-item'
    )
    .forEach((item) => {

        item.addEventListener(
            "change",
            () => {

                calculateTotal();

                saveMechanicState();
            }
        );
    });


// ==========================================
// 外装
// ==========================================

exteriorCount.addEventListener(
    "change",
    () => {

        calculateTotal();

        saveMechanicState();
    }
);


// ==========================================
// カラー
// ==========================================

colorCount.addEventListener(
    "change",
    () => {

        calculateTotal();

        saveMechanicState();
    }
);


// ==========================================
// 販売
// ==========================================

saleQuantities.forEach((input) => {

    input.addEventListener(
        "input",
        () => {

            if (
                Number(input.value) < 0
            ) {

                input.value = "0";
            }


            calculateTotal();

            saveMechanicState();
        }
    );
});


// ==========================================
// オーダーシート入力時も保存
// ==========================================

orderInput.addEventListener(
    "input",
    () => {

        saveMechanicState();
    }
);


// ==========================================
// オーダー解析
// ==========================================

analyzeButton.addEventListener(
    "click",
    () => {

        const text =
            orderInput.value
                .trim();


        // 入力なし

        if (!text) {

            orderSummary.innerHTML =

                '<p class="empty-message">' +
                'オーダーシートが入力されていません。' +
                '</p>';


            orderResult.innerHTML =

                '<p class="empty-message">' +
                'オーダー内容がありません。' +
                '</p>';


            saveMechanicState();

            return;
        }


        const items =
            parseOrder(text);


        // 解析失敗

        if (
            items.length === 0
        ) {

            orderSummary.innerHTML =

                '<p class="empty-message">' +
                '解析できる項目が見つかりませんでした。' +
                '</p>';


            orderResult.innerHTML =

                '<p class="empty-message">' +
                'オーダーシートの形式を確認してください。' +
                '</p>';


            saveMechanicState();

            return;
        }


        renderSummary(items);

        renderDetails(items);

        updateCustomCounts(items);


        // 解析結果・外装数・カラー数を保存

        saveMechanicState();
    }
);

// ==========================================
// 会計履歴
// ==========================================

function getPaymentHistory() {

    try {

        const saved =
            localStorage.getItem(
                HISTORY_STORAGE_KEY
            );

        if (!saved) {
            return [];
        }

        return JSON.parse(saved);

    } catch (error) {

        console.error(
            "会計履歴の読み込みに失敗しました。",
            error
        );

        return [];
    }
}


function savePaymentHistory(history) {

    localStorage.setItem(
        HISTORY_STORAGE_KEY,
        JSON.stringify(history)
    );
}


completePaymentButton.addEventListener(
    "click",
    () => {

        // 画面表示は ¥1,250,000 のまま
        // 保存する金額は 1250000 にする

        const amount =
            Number(
                totalPrice
                    .textContent
                    .replace(/[¥￥,]/g, "")
                    .trim()
            ) || 0;


        // 0円の会計は保存しない

        if (amount <= 0) {

            alert(
                "合計金額が0円です。"
            );

            return;
        }


        const now =
            new Date();


        const historyItem = {

            id:
                Date.now(),

            date:
                now.toLocaleString(
                    "ja-JP"
                ),

            amount:
                amount

        };


        const history =
            getPaymentHistory();


        // 最新を一番上に追加

        history.unshift(
            historyItem
        );


        // 最大30件

        if (
            history.length >
            MAX_HISTORY_COUNT
        ) {

            history.length =
                MAX_HISTORY_COUNT;
        }


        savePaymentHistory(
            history
        );


        completePaymentButton.textContent =
            "保存しました！";


        setTimeout(
            () => {

                completePaymentButton.textContent =
                    "会計完了";

            },
            1000
        );

    }
);

// ==========================================
// 合計金額コピー
// ==========================================

copyButton.addEventListener(
    "click",
    async () => {

        try {

await navigator
    .clipboard
    .writeText(
        totalPrice
            .textContent
            .replace(/[¥￥,]/g, "")
            .trim()
    );


            copyButton.textContent =
                "コピーしました！";


            setTimeout(
                () => {

                    copyButton.textContent =
                        "コピー";

                },
                1000
            );

        } catch {

            alert(
                "コピーできませんでした。"
            );
        }
    }
);


// ==========================================
// リセット
// ==========================================

resetButton.addEventListener(
    "click",
    () => {


        // 性能

        priceItems.forEach(
            (item) => {

                item.checked =
                    false;
            }
        );


        performanceCitizenDiscount.checked = false;
        citizenExteriorCount.value = '0';
        citizenColorCount.value = '0';
        // 外装 / カラー

        exteriorCount.value =
            "0";

        colorCount.value =
            "0";


        // 販売

        saleQuantities.forEach(
            (input) => {

                input.value =
                    "0";
            }
        );
        // 修理

        repairQuantities.forEach(
            (input) => {

                input.value =
                    "0";
            }
        );

        // オーダーシート

        orderInput.value =
            "";


        // SUMMARY

        orderSummary.innerHTML =

            '<p class="empty-message">' +
            'オーダーを解析すると、ここに集計結果が表示されます' +
            '</p>';


        // DETAIL LIST

        orderResult.innerHTML =

            '<p class="empty-message">' +
            'オーダー内容がここに一覧表示されます' +
            '</p>';


        // 金額

        calculateTotal();


        // 保存内容を削除

        localStorage.removeItem(
            MECHANIC_STORAGE_KEY
        );
    }
);


// ==========================================
// ダークモード
// ==========================================

themeButton.addEventListener(
    "click",
    () => {

        document.body
            .classList
            .toggle("dark");


        const dark =
            document.body
                .classList
                .contains("dark");


        themeButton.textContent =
            dark
                ? "☀️ 通常モード"
                : "🌙 ダークモード";


        localStorage.setItem(
            "theme",
            dark
                ? "dark"
                : "light"
        );
    }
);


// ==========================================
// 前回使ったテーマを復元
// ==========================================

if (
    localStorage.getItem(
        "theme"
    ) === "dark"
) {

    document.body
        .classList
        .add("dark");


    themeButton.textContent =
        "☀️ 通常モード";
}


// ==========================================
// メカニックの前回状態を復元
// ==========================================

orderInput.addEventListener("input", () => updateDuplicateNotice());
restoreMechanicState();
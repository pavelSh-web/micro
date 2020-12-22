/* eslint-disable default-case */
/* eslint-disable wrap-iife */
/* eslint-disable func-names */
/* eslint-disable guard-for-in */
const less = require('less');
const cssnano = require('cssnano');

async function renderStyle({ source, data, options } = {}) {
    // Something wrong
    if (!source) {
        return '';
    }

    source += _serializeVars(_buildVars(data));

    const out = await less.render(source, {
        compress: false,
        modifyVars: _buildVarsOld(data),
        ...options
    });

    const outCompressed = await cssnano.process(out.css);

    return outCompressed.css;
}


/*
* SERIALIZE VARS
* Аналон JSON.stringify()
* Преобразует обьект, созданный в _buildVars, в читабельный для LESS вид:
* 1) меняет ',' на ';'
* 2) убирает фигурные скобки в начале и в конце обьекта
* 3) на выходе отдает обьект в виде строки
*/
function _serializeVars(data) {
    function getLeading(pad = 0) {
       return ' '.repeat(pad);
    }

    function stringify(obj, pad = 0) {
        if (obj == null) {
            return 'null';
        }

        if (typeof obj !== 'object' || Array.isArray(obj)) {
            return value(obj);
        }

        const leading = getLeading(pad);

        const str = Object.entries(obj)
            .filter(([k, v]) => k !== '' && k != null && (typeof v !== 'function'))
            .map(([k, v]) => {
                // Deeper
                if (typeof v === 'object' && v != null) {
                    return `.${ k } {\n${ stringify(v, pad + 2) }\n${ leading }}`;
                }
                // Index
                else if (k == +k) {
                    return `${ k }: ${ value(v) };`;
                }

                // Var
                return `@${ k }:${ value(v) };`;
            })
            .join(`\n${ leading }`);

        return `${ leading }${ str }`;
    }

    function value(val) {
        switch (typeof val) {
        case 'string':
            // Если строка законна
            if (
                /^\s*[\w-,:%]+\s*$/.test(val) || // isSimpleString
                /^\s*-?\d+\.?\d*(?:px|%)?\s*$/.test(val) || // isNumericValue (-11.5%, 1345px, 999.5333px, ...)
                /^\s*(#([\da-f]{3}|[\da-f]{6}|[\da-f]{8})|((rgb|hsl)a?\([^)]+\)))\s*$/i.test(val) || // isColor
                /^\s*(?:linear-gradient|repeat-linear-gradient|radial-gradient)\(.*\)\s*$/i.test(val) || // isGradient
                /^\s*(#([\da-f]{3}){1,2}|\w+\((?:\d+%?(?:\s*,\s*)*){3}(?:\d*\.?\d+)?\))\s*url\((.*)\)\s*$/i.test(val) || // isColorAndTexture
                /^\s*url\([a-z0-9_\/\\\'\"?.,%;:&\(\)]*\)\s*$/i.test(val) // isCssUrl
            ) {
                return val.trim();
            }

            // В остальных случаях вырезаем кавычки из переменной (меняем одинарный на двойные
            return `'${ val.split('\'').join('"') }'`;
        case 'number':
        case 'boolean':
            return val;
        }

        return 'null';
    }

    return `#data() {\n${ stringify(data, 2) }\n}`;
}


/*
* BUILD VARS
* Собирает обьект обьект с переменными
* Массивы разворачиваются наружу, вкладывать массивы друг в друга нельзя
* Данные вида:
{
    background: '#FFF',
    text: {
        button: "Купить",
        tip: "Доставка бесплатно"
    },
    z-index: 1,
    list: [
        {id: 1, color: #254950},
        {id: 3, color: #000, font-size: 14px}
    ]
}
* превратятся в обьект  с переменными:
{
    'background': '#FFF',
    'text': {
        'button': "'Купить'",
        'tip': "'Доставка бесплатно'"
    },
    'z-index': '1',
    'list': {
        'id': {'0': '1', '1': '3'},
        'color': {'0': '#254950', '1': '#000' }
        'font-size': {'1': '14px' }
    }
}
*/
function _buildVars(data) {
    if (typeof data != 'object') {
        return;
    }

    const lessVars = {};

    for (const name in data) {
        const value = data[name];

        // Кириллица, теги, строки в строках и прочие табуляции не нужны в стилях, это скорее всего пользовательский текст
        const isDeny = !data.hasOwnProperty(name) || /^_/.test(name) || (typeof value === 'string' && /[а-яё<>\n\t\`'"]|\\/gi.test(value));

        if (isDeny) {
            continue;
        }

        // это массив
        if (Array.isArray(value)) {
            const newValue = {};

            value.forEach((item, i) => {
                // если в массив вложен массив, то ой все
                if (Array.isArray(item)) {
                    return;
                }
                // если в массиве вложены обьекты, разворачиваем массив, но только на первом уровне,
                // игнорируя вложенные обьекты
                else if (typeof item == 'object') {
                    Object.entries(item).forEach(([key, value]) => {
                        if (typeof value === 'object') {
                            return;
                        }

                        if (!newValue[key]) {
                            newValue[key] = {};
                        }

                        newValue[key][i] = value;
                    });
                }
                // если в массив сложены другие примитивы, то делаем обычный обьект
                else {
                    newValue[i] = item;
                }
            });

            lessVars[name] = _buildVars(newValue);
        }
        // это обьект
        else if (value && typeof value == 'object') {
            lessVars[name] = _buildVars(value);
        }
        else {
            lessVars[name] = value;
        }
    }

    return lessVars;
}


// Старая функция сборки переменных
function _buildVarsOld(data, prefix = '', deph = -1) {
    if (typeof data != 'object') {
        return;
    }

    let lessVars = {};

    // В конец префикса дописываем точку
    if (prefix) {
        prefix += '-';
    }

    deph += 1;

    /* eslint no-loops/no-loops: 0 */
    for (const name in data) {
        if (!data.hasOwnProperty(name) || /^_/.test(name)) {
            continue;
        }

        let value = data[name];
        let fullPath = prefix + name;

        // мы сейчас обходим массив, поэтому опускаем название ключа из префикса
        if (Math.floor(name) >= 0) {
            fullPath = prefix;
        }

        const deny = /[а-яё<>\n\t\`]|\\/gi.test(value);

        // эта строка валидна (без кириллицы, тегов, возможно это цвет или путь, какая то цифра или процент), добавляем сразу
        if (
            typeof value != 'undefined'
            && typeof value != 'object'
            && (typeof value == 'number' || value.length)
            && !deny
        ) {
            const isNumber = /^[\d ]*$/.test(value);
            const isColor = /^\s*(#([\da-f]{3}){1,2}|\w+\((?:\d+%?(?:\s*,\s*)*){3}(?:\d*\.?\d+)?\));?\s*$/i.test(value);
            const isGradient = /^\s*(?:linear-gradient|repeat-linear-gradient)\(.*\)/i.test(value);
            const isColorAndTexture = /^\s*(#([\da-f]{3}){1,2}|\w+\((?:\d+%?(?:\s*,\s*)*){3}(?:\d*\.?\d+)?\))\s*url\((.*)\)$/i.test(value);
            const isCssUrl = /^\s*url\([a-z0-9_\/\\\'\"?.,%;:&\(\)]*\)\s*$/i.test(value);

            // это цвет
            if (isNumber || isColor || isGradient || isColorAndTexture || isCssUrl) {
                lessVars[fullPath] = value;
            }
            else {
                // В остальных случаях вырезаем кавычки из переменной (меняем одинарный на двойные)
                if (typeof (value) === 'string') {
                    value = value.split('\'')
                        .join('"');
                }
                lessVars[fullPath] = `'${ value }'`;
            }
        }

        // какой то обьект или массив (больше n уровней вложенности не лезем)
        if (deph < 7 && value && typeof value == 'object') {
            // это обьект или массив обьектов, углубляемся
            if (!Array.isArray(value) || (value.length && typeof value[0] == 'object')) {
                lessVars = _extend(lessVars, _buildVarsOld(value, fullPath, deph));
            }
            // это массив
            else {
                lessVars[fullPath] = `'${ value.join(',') }'`;
            }
        }
    }

    return lessVars;
}

// обьединяет 2 обьекта
function _extend(arr1, arr2) {
    if (typeof arr2 != 'object') {
        return arr1;
    }

    const arr = Object.assign({}, arr1);

    for (const key in arr2) {
        if (!arr2.hasOwnProperty(key)) {
            continue;
        }

        const value = arr2[key];

        if (typeof arr[key] != 'undefined' && typeof arr[key] != 'object' && typeof value != 'object') {
            arr[key] += (`, ${ value }`);
        }
        else {
            arr[key] = value;
        }
    }

    return arr;
}


module.exports = renderStyle;


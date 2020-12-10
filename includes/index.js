/* eslint-disable default-case */
/* eslint-disable wrap-iife */
/* eslint-disable func-names */
/* eslint-disable guard-for-in */
const less = require('less');

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

    return out.css;
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
    function stringify(obj) {
        if (obj == null || typeof obj !== 'object' || Array.isArray(obj)) {
            return value(obj);
        }

        let newObject = `{${ Object.keys(obj).map(k => (typeof obj[k] === 'function' ? null : `${ k == +k ? k : `@${ k }` }:${ value(obj[k]) }`)).filter(i => i) }}`.split('');

        newObject = newObject.map((elem, i) => {
            if (elem === ',') {
                if (newObject[i - 1] === ';') {
                    elem = '';
                }
                else if (newObject[i - 1] === '}') {
                    elem = ';';
                }
            }

            return elem;
        });

        return newObject.join('');
    }

    function value(val) {
        switch (typeof val) {
            case 'string':
                return `"${ val.replace(/\\/g, '\\\\').replace(/\"/g, '\\"') }";`;
            case 'number': 
                return `${ val };`;
            case 'boolean':
                return `${ val };`;
            case 'function':
                return 'null';
            case 'object':
                if (val instanceof Date)  
                    return `"${ val.toISOString() }";`;
                if (val instanceof Array) 
                    return `[${ val.map(value).join(',') }];`;
                if (val === null)         
                    return 'null';
                return stringify(val);
        }
    }
    
    return stringify(data).slice(0, -1).slice(1);
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
    '@background': '#FFF',
    '@text': {
        '@button': "'Купить'",
        '@tip': "'Доставка бесплатно'"
    },
    '@z-index': '1',
    '@list': {
        '@id': {'0': '1', '1': '3'},
        '@color': {'0': '#254950', '1': '#000' }
        '@font-size': {'1': '14px' }
    }
}
*/
function _buildVars(data) {
    if (typeof data != 'object') {
        return;
    }

    const lessVars = {};

    for (const name in data) {
        if (!data.hasOwnProperty(name) || /^_/.test(name)) {
            continue;
        }
        
        const value =  data[name];
        lessVars[name] = value;


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

    // если есть id - добавляем переменную с ним
    if (data.id && /^[\d ]*$/.test(data.id)) {
        lessVars.id = data.id;
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
            const isCssUrl = /url\([a-z0-9_\/\\\'\"?.,%;:&\(\)]*\)/i.test(value);

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


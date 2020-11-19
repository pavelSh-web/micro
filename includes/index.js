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

    source = `${ _serializeVars(_buildVars(data)) } ${ source }`;

    const out = await less.render(source, {
        compress: false,
        ...options
    });

    return out.css;
}


/*
* Весь рендер LESS на стороне клиента происходит здесь.
* Если в каком то скрипте рендерится самостоятельно - настоятельное требование выполнить рефакторинг и унести функционал сюда
* На данный момент скрипт рендерит стили для блоков и модалок, включая при этом переданные данные в виде переменных
* Принимает обьект с данными БЛОКА (модала), специально ничего подготавливать не нужно
* но можно передать любой обьект
* Данные вида:
{
    ab: '#FFF',
    bc: 'русские буквы',
    cd: 1,
    de: [
        {ab: 1},
        {ab: 3}
    ],
    ef: {
        ab: "string"
    }
}
* превратятся в less переменные:
@ab: #FFF // без кавычек
@cd: 1
@de--ab: "1, 3" // вот такие строки LESS может распарсить как массивы
@ef-ab: "string"
* вложенность таких массивов как de, ef ограничена где то 4 уровнями вложенности
*/

/*
* BUILD VARS
* Специальные переменные из this.data которые необхоидмо вставить как перменные LESS
* собирает обьект без вложенности с данными из блока, которые соответствуют заданным условиям (это путь, число или цвет)
*/

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

function _serializeVars(data) {
    function stringify(obj) {
        if (typeof obj !== 'object' || obj === null || obj instanceof Array) {
            return value(obj);
        }

        let newObject = `{${ Object.keys(obj).map(k => (typeof obj[k] === 'function' ? null : `${ k }:${ value(obj[k]) }`)).filter(i => i) }}`.split('');

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
                return `"${ val.replace(/\\/g, '\\\\').replace('"', '\\"') }";`;
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

function _buildVars(data, prefix = '@') {
    if (typeof data != 'object') {
        return;
    }

    const lessVars = {};

    for (const name in data) {
        let value =  data[name];
        const path = prefix + name;

        // эта строка валидна (без кириллицы, тегов, возможно это цвет или путь, какая то цифра или процент), добавляем сразу
        if (
            typeof value != 'undefined'
            && typeof value != 'object'
            && (typeof value == 'number' || value.length)
        ) {
            const isNumber = /^[\d ]*$/.test(value);
            const isColor = /^\s*(#([\da-f]{3}){1,2}|\w+\((?:\d+%?(?:\s*,\s*)*){3}(?:\d*\.?\d+)?\));?\s*$/i.test(value);
            const isGradient = /^\s*(?:linear-gradient|repeat-linear-gradient)\(.*\)/i.test(value);
            const isColorAndTexture = /^\s*(#([\da-f]{3}){1,2}|\w+\((?:\d+%?(?:\s*,\s*)*){3}(?:\d*\.?\d+)?\))\s*url\((.*)\)$/i.test(value);
            const isCssUrl = /url\([a-z0-9_\/\\\'\"?.,%;:&\(\)]*\)/i.test(value);

            // это цвет
            if (isNumber || isColor || isGradient || isColorAndTexture || isCssUrl) {
                lessVars[path] = value;
            }
            else {
                // В остальных случаях вырезаем кавычки из переменной (меняем одинарный на двойные)
                if (typeof (value) === 'string') {
                    value = value.split('\'')
                        .join('"');
                }
                lessVars[path] = `'${ value }'`;
            }
        }

        if (value && typeof value == 'object') {
            // это массив 
            if (Array.isArray(value)) {
                const newValue = {};                
                
                value.forEach((item, i) => {
                    if (value.length && typeof value[0] == 'object') {
                        for (const key in item) {
                            if (!newValue[prefix + key]) {
                                newValue[prefix + key] = [];
                            }
                            
                            newValue[prefix + key][i] = item[key];
                        }
                    } 
                    else {
                        newValue[i] = item;
                    }
                });

                lessVars[path] = _buildVars(newValue, '');
            }
            // это обьект
            else {
                lessVars[path] = _buildVars(value);
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


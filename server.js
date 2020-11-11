'use strict';

// const fs       = require('fs');
const http     = require('http');
const url      = require('url');
// const mime     = require('mime-types');
// const punycode = require('punycode');



http.createServer((req, res) => {
    const RenderLess     = require('./includes/index.js');

    const params = {
        source: '[data-b-id="2"][data-id="559451"] {\n    // используем рулесет для фона\n    @component-bg();\n    // для отступов\n    & when (@cover = 0) {\n        .editor-indent(indent, @indent-top, @indent-bottom);\n    }\n\n    & when (@cover = 1) {\n        .editor-indent(indent, @indent-min_padding, @indent-min_padding);\n    }\n\n    // создает @color переменную на базе цвета фона\n    .invert-color(@background-color, @background-text);\n\n    .container {\n        color: @color;\n    }\n\n    .text-holder {\n        ul li {\n            background: fade(@background-color, 65%);\n        }\n    }\n\n    .component-button(@form-color);\n}\n\n@cover: 0;\n@indent-min_padding: 30;\n@indent-top: 70;\n@indent-bottom: 70;\n',
        data: {
            id: '559451',
            title_1: '<p><span style="font-weight: 700;">Хороший ремонт любой сложности под ключ без переплат</span></p>',
            title_2: '<p>Уже 356 клиентов довольны ремонтом</p>',
            form_title: '<p>Оставьте заявку на бесплатный замер вашего помещения</p>',
            form_title_2: '<p>И получите выгодное предложение</p><p>в течение дня</p>',
            form_bottom: 'Мы не передаем Вашу персональную информацию третьим лицам',
            desc: 'Текстовое описание',
            form: {
                submit: 'Бесплатный замер',
                color: '#222',
                action: 'modal',
                modal_id: 'done',
                list: [
                    {
                        id: 10001,
                        type: 'name',
                        name: 'Имя',
                        desc: 'Например: Владимир',
                        is_required: 0
                    },
                    {
                        id: 28299,
                        type: 'email',
                        name: 'E-mail',
                        desc: '',
                        is_required: 1
                    }
                ],
                btn_style: [
                    'bordered',
                    'squared'
                ],
                action_redirect: '',
                pay: {
                    price: ''
                },
                goals: {
                    goal: '',
                    goal_html: ''
                },
                submit_color: '#222',
                name: 'Заявка',
                product_enabled: 0
            },
            swap: 0,
            show_form: 1,
            show_form_title_2: 0,
            show_form_bottom: 1,
            show_desc: 0,
            content_align: 'center',
            title_1_tag: 'div',
            title_2_tag: 'div',
            cover: 1,
            indent: {
                top: 110,
                bottom: 110,
                min_padding: 110
            },
            background: {
                parallax: 0,
                color: '#000',
                contrast: 'light',
                text: 'contrast',
                gradient: 0,
                image: '/img/1000013790_1920.jpg',
                opacity: 50,
                type: 'video',
                baseBgMobile: false,
                position: {
                    x: '55.20%',
                    y: '50.35%'
                },
                video_color: '#000',
                video_preview_type: 'image',
                video: {
                    url: '/files/video_59.mp4',
                    link: '/files/video_59.mp4',
                    id: null,
                    type: 'custom'
                },
                video_image: '/img/2000014550_1200.jpg',
                video_image_id: 2000014550,
                video_image_ext: 'jpg',
                video_image_width: 1200,
                video_image_proportion: 60,
                video_image_average: '#87AA86'
            },
            hide_title: 0,
            hide_subtitle: 0,
            _anchor: ''
        },
        options: {},
        mixins: "@color-black: #000000;@color-white: #FFFFFF;@color-blue: #4773ff;@color-blue-light: #7a9aff;@color-dark: #1B1B1C;@color-light: #FFFFFF;@mobile_small_to: 350px;@mobile_to: 570px;@mobile_large_from: @mobile_to + 1px;@mobile_large_to: 767px;@tablet_from: @mobile_large_to + 1px;@tablet_to: 1024px;@tablet_large_from: @tablet_to + 1px;@tablet_large_to: 1199px;@desktop_small_from: 980px;@desktop_small_to: @tablet_large_to;@desktop_from: @tablet_large_to + 1px;@desktop_to: 1500px;@desktop_large_from: @desktop_to + 1px;@desktop_large_to: 1920px;@desktop_imac_from: @desktop_large_to + 1px;.screen-mobile-small(@rules) { @media screen and (max-width: @mobile_small_to) { @rules(); }}.screen-mobile(@rules) { @media screen and (max-width: @mobile_to) { @rules(); }}.screen-mobile-large(@rules) { @media screen and (min-width: @mobile_large_from) and (max-width: @mobile_large_to) { @rules(); }}.screen-mobile-all(@rules) { @media screen and (max-width: @mobile_large_to) { @rules(); }}.screen-all-mobile(@rules) { .screen-mobile-all(@rules);}.screen-tablet(@rules) { @media screen and (min-width: @tablet_from) and (max-width: @tablet_to) { @rules(); }}.screen-tablet-large(@rules) { @media screen and (min-width: @tablet_large_from) and (max-width: @tablet_large_to) { @rules(); }}.screen-tablet-all(@rules) { @media screen and (min-width: @tablet_from) and (max-width: @tablet_large_to) { @rules(); }}.screen-desktop-small(@rules) { @media screen and (min-width: @desktop_small_from) and (max-width: @desktop_small_to) { @rules(); }}.screen-desktop(@rules) { @media screen and (min-width: @desktop_from) and (max-width: @desktop_to) { @rules(); }}.screen-desktop-large(@rules) { @media screen and (min-width: @desktop_large_from) { @rules(); }}.screen-desktop-imac(@rules) { @media screen and (min-width: @desktop_imac_from) { @rules(); }}.screen-desktop-all(@rules) { @media screen and (min-width: @desktop_from) { @rules(); }}.screen-tablet-desktop(@rules) { @media screen and (min-width: @tablet_from) { @rules(); }}.screen-portrait(@rules) { @media (orientation: portrait) { @rules(); }}.screen-landscape(@rules) { @media (orientation: landscape) { @rules(); }}.is-pointer(@rules) { .is-pointer & { @rules(); }}.is-desktop(@rules) { .is-desktop & { @rules(); }}.is-mobile(@rules) { .is-mobile & { @rules(); }}.is-touch(@rules) { .is-touch & { @rules(); }}.is-osx(@rules) { .is-osx & { @rules(); }}.is-android(@rules) { .is-android & { @rules(); }}.is-edge(@rules) { .is-edge & { @rules(); }}.is-firefox(@rules) { .is-firefox & { @rules(); }}.is-chrome(@rules) { .is-chrome & { @rules(); }}.placeholder(@color) { &::-webkit-input-placeholder {color: @color;} &::-moz-placeholder {color: @color;} &:-moz-placeholder {color: @color;} &:-ms-input-placeholder {color: @color;}}.will-change() { transform: translateZ(0); will-change: transform;}.keyframes(@name; @arguments) { @keyframes @name { @arguments(); }}.animation(@arguments) { animation: @arguments;}.animation-delay(@n, @start: 50ms, @interval: 180ms, @i: 0) when (@i < @n) { @child: @i + 1; &:nth-child(@{child}) { animation-delay: (@start + (@i * @interval)); } .animation-delay(@n, @start, @interval, @child);}.transition-delay(@n, @start: 50ms, @interval: 180ms, @i: 0) when (@i < @n) { @child: @i + 1; &:nth-child(@{child}) { transition-delay: (@start + (@i * @interval)); } .transition-delay(@n, @start, @interval, @child);}.retina(@image, @w, @h) { @media (-webkit-min-device-pixel-ratio: 1.5), (min-resolution: 144dpi), (min-resolution: 1.3dppx) { background-image: url(@image); background-size: @w @h; }}.optimize-image() { image-rendering: optimizeSpeed; image-rendering: auto; image-rendering: -o-crisp-edges; image-rendering: optimize-contrast; -ms-interpolation-mode: nearest-neighbor;}.for(@list, @code) { & { .loop(@i:1) when (@i =< length(@list)) { @value: extract(@list, @i); @code(); .loop(@i + 1); } .loop(); }}.invert-color(@bg) { @color: @color-dark;}.invert-color(@bg, @text) { @color: @color-dark;}.invert-color(@bg) when (iscolor(@bg)) { @color: contrast(@bg, #212121, #FFF);}.invert-color(@bg, @text: 'contrast') when (iscolor(@bg)) and (@text = 'contrast') { @color: contrast(@bg, @color-dark, @color-light);}.invert-color(@bg, @text) when (@text = 'inherit') { @color: inherit;}.invert-color(@bg, @text) when (@text = 'black'), (@text = 'dark') { @color: @color-dark;}.invert-color(@bg, @text) when (@text = 'white'), (@text = 'light') { @color: @color-light;}.invert-color(@bg, @text) when (iscolor(@text)) { @color: @text;}@background-position-x: 'center';@background-position-y: 'center';@background-text: 'contrast';@background-gradient: 0;@background-color: nul;@background-opacity: nul;@background-image: nul;@background-video_image: nul;@background-video_preview_type: nul;@background-type: nul;@background-video_color: nul;@mobile-color: nul;@mobile-text: 'contrast';@component-bg: { .component-bg { .image { & when not(@background-position-x = 'center'), not(@background-position-y = 'center') { background-position: e(@background-position-x) e(@background-position-y); } & when not(@background-type = nul) { & when (e(@background-type) = image) and not(@background-image = nul) { background-image: url(@background-image); } & when (@background-type = 'video') and not(@background-video_image = nul) and not(@background-video_preview_type = 'color') { background-image: url(@background-video_image); } & when (@background-type = 'video') and (@background-video_preview_type = 'color') and not(@background-video_color = nul) { background-color: @background-video_color; background-image: none; } } } .overlay when not(@background-color = nul) and (@background-gradient = 0) { background: @background-color; } .overlay when (isnumber(@background-opacity)) and (@background-gradient = 0) { opacity: @background-opacity / 100; } .overlay when (isnumber(@background-opacity)) and (@background-gradient > 0) and not(@background-gradient > 100) { background: linear-gradient(to bottom, @background-color 0%, fade(@background-color, @background-opacity) unit(@background-gradient, %), transparent 140%); opacity: 1; transition: none; } .overlay when (isnumber(@background-opacity)) and (@background-gradient > 100) { background: linear-gradient(to top, @background-color 0%, fade(@background-color, @background-opacity) unit(200 - @background-gradient, %), transparent 140%); opacity: 1; transition: none; } }};@indent-top: nul;@indent-bottom: nul;.editor-indent(@item: indent, @top_param: @indent-top, @bottom_param: @indent-bottom) { .@{item} { & when not(@top_param = nul) { padding-top: unit(@top_param, px); } & when not(@bottom_param = nul) { padding-bottom: unit(@bottom_param, px); } .screen-mobile({ & when not(@top_param = nul) { padding-top: unit(@top_param * 0.5, px); } & when not(@bottom_param = nul) { padding-bottom: unit(@bottom_param * 0.5, px); } }); }}.component-button(@color) { .component-button { & when not(@color = nul) and (iscolor(@color)) { &.bordered { .btn-content { color: @color; &:hover { color: darken(@color, 15%); } } } &.filled { .btn-content { border: 1px solid @color; background-color: @color; color: contrast(@color, #222,#fff, 80%); } &:not(.shadow):not(.zoom) .btn-content:hover { background-color: darken(@color, 5%); } } &.shadow { .btn-content { box-shadow: 0 15px 40px fade(@color, 20%); &:hover { box-shadow: 0 15px 40px fade(@color, 25%); } } } } }}"
    };

    const render = new RenderLess(params);

    render.renderStyle()   
        .then((css) => console.log(css))
        .catch();
}).listen('1212', '0.0.0.0');

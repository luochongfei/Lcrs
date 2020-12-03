/*
 * @Description: jQuery 版旋转木马轮播图
 * @Date: 2020-12-01 09:47:47
 * @LastEditors: luochongfei
 * @LastEditTime: 2020-12-03 10:02:39
 */
// import './jquery.crs.css';

class Crs {
    constructor(selector, options) {

        this.$wrap = $(selector);

        this.setting = Object.assign({
            wrapWidth: 1000, // 外容器宽度
            wrapHeight: 380, // 外容器高度
            focusWidth: 620, // 焦点项的宽度
            focusHeight: 380, // 焦点项的高度
            autoPlay: false, // 是否自动播放
            interval: 2500, // 自动播放间隔时间(单位:ms)
            duration: 360, // 动画过程时间(单位:ms)
            vAlign: 'middle', // 子项对齐方式 ['top', 'bottom', 'middle']
            prev: true, // 上一个 按钮 (false表示不显示，true表示使用内置提供的，也可以传入 jQuery 对象)
            next: true, // 下一个 按钮 (功能同 上一个 按钮)
            pager: true,
            onChange: $.noop, // 切换时回调
        }, options);

        this.$panel = this.$wrap.find('.crs-panel'); // 项容器
        this.$originItems = this.$panel.children(); // 项集合
        this.originItemLen = this.$originItems.length; // 原始项的数量


        // 动画进行中标识容器
        this.aniArr = [];

        // 调整 DOM 元素
        this.initDom();

        // 初始化样式
        this.initStyle();

        // 绑定事件
        this.bindEvent();
    }


    // 绑定事件
    bindEvent() {
        // 上一个按钮 事件
        if (this.$prev) {
            this.$prev.on('click', (e) => {
                this.move('right');
            }).on('mouseover', () => {
                this.stopPlay();
            }).on('mouseout', () => {
                this.startPlay();
            });
        }

        // 下一个按钮 事件
        if (this.$next) {
            this.$next.on('click', (e) => {
                this.move();
            }).on('mouseover', () => {
                this.stopPlay();
            }).on('mouseout', () => {
                this.startPlay();
            });
        }

        // 开始自动播放
        this.startPlay();

        // 鼠标进入容器暂停 离开容器开始
        this.$wrap.hover(() => {
            this.stopPlay();
        }, () => {
            this.startPlay();
        });
    }

    // 调整 DOM 元素
    initDom() {
        const setting = this.setting;

        // 原始项添加标识
        this.$originItems.wrap('<div class="crs-item" />');
        this.$items = this.$panel.find('.crs-item');
        this.$items.each((index, item) => {
            $(item).attr('data-crs-index', index);
        });

        // 上翻按钮
        if (setting.prev instanceof jQuery && setting.prev.length) {
            this.$prev = setting.prev;
        } else if (setting.prev) {
            this.$prev = $('<span class="crs-prev" />').appendTo(this.$wrap);
        } else {
            this.$prev = null;
        }

        // 下翻按钮
        if (setting.next instanceof jQuery && setting.next.length) {
            this.$next = setting.next;
        } else if (setting.next) {
            this.$next = $('<span class="crs-next" />').appendTo(this.$wrap);
        } else {
            this.$next = null;
        }

        // 分页器
        if (setting.pager) {
            this.$page = $('<div class="crs-page" />');
            this.$page.css({
                top: this.wrapHeight + 10
            });
            for (let i = 0; i < this.originItemLen; i += 1) {
                this.$page.append(`<i class="crs-page-item ${i === 0 ? 'crs-page-item-active' : ''}"></i>`)
            }
            this.$wrap.append(this.$page);
            this.$pageItems = this.$page.find('.crs-page-item');
        }


        // 因此功能布局需要品字型，为双数时，需通过复制补齐
        if (this.$items.length % 2 === 0) {
            this.isRepair = true;
            this.$items.eq(this.$items.length - 1).before(this.$items.eq(this.$items.length / 2).clone());
            this.$items = this.$panel.children();
        }
    }

    // 初始化样式
    initStyle() {
        const setting = this.setting;
        // 侧边的宽度（1侧）
        const asideWidth = (setting.wrapWidth - setting.focusWidth) / 2;
        // 侧边的数量（这里指1侧，两侧相等）
        const asideCount = Math.floor(this.$items.length / 2);
        // 第 1 项
        const $firstItem = this.$items.first();
        // 第 1 项的层级
        this.firstItemZIndex = Math.ceil(this.$items.length / 2) + 1;

        // 每个子项统一设置
        this.$items.css({
            position: 'absolute',
        });

        // 项容器样式设置
        this.$panel.css({
            width: setting.wrapWidth,
            height: setting.wrapHeight,
        });

        // 上一个按钮样式
        if (this.$prev && this.$prev.hasClass('crs-prev')) {
            this.$prev.animate({
                left: 0,
                top: 0,
                zIndex: this.$items.length,
                width: asideWidth,
                height: setting.wrapHeight,
            });
        }

        // 下一个按钮样式
        if (this.$next && this.$next.hasClass('crs-next')) {
            this.$next.animate({
                right: 0,
                top: 0,
                zIndex: this.$items.length,
                width: asideWidth,
                height: setting.wrapHeight,
            });
        }

        // 第 1 项样式设置
        $firstItem.css({
            top: 0,
            left: asideWidth,
            zIndex: this.firstItemZIndex,
            width: setting.focusWidth,
            height: setting.focusHeight,
            opacity: 1,
        });

        // 第 1 项左侧要显示的项
        const $leftItems = this.$items.slice(Math.ceil(this.$items.length / 2), this.$items.length);
        // 第 1 项右侧要显示的项
        const $rightItems = this.$items.slice(1, (this.$items.length / 2) + 1);
        // 两侧项各个之间的距离
        const slideItemSpacing = asideWidth / asideCount;
        // 对齐系数
        const valignRatio = {
            top: 0,
            middle: 1,
            bottom: 2,
        };

        // 左侧项样式设置
        $leftItems.each((index, item) => {
            const itemHeight = Math.ceil(setting.focusHeight - ((asideCount - index) * slideItemSpacing));
            const itemWidth = setting.focusWidth * (itemHeight / setting.focusHeight);
            const itemTop = ((setting.wrapHeight - itemHeight) / 2) * valignRatio[setting.vAlign];

            $(item).css({
                top: itemTop,
                left: index * slideItemSpacing,
                zIndex: index + 1,
                width: itemWidth,
                height: itemHeight,
                opacity: 1 / (((asideCount + 1) - index) * 0.9)
            });
        });


        // 右侧项样式设置
        $rightItems.each((index, item) => {
            const itemHeight = Math.ceil(setting.focusHeight - ((index + 1) * slideItemSpacing));
            const itemWidth = setting.focusWidth * (itemHeight / setting.focusHeight);
            const itemLeft = (asideWidth + setting.focusWidth + (slideItemSpacing * (index + 1))) - itemWidth;
            const itemTop = ((setting.wrapHeight - itemHeight) / 2) * valignRatio[setting.vAlign];

            $(item).css({
                top: itemTop,
                left: itemLeft,
                zIndex: (asideCount - index) + 1,
                width: itemWidth,
                height: itemHeight,
                opacity: (1 / index) * 0.9
            });
        });

    }

    // 核心方法 项移动
    move(direction) {
        const dir = direction || 'left';
        const zIndexArr = [];

        // 正在执行动画中
        if (Crs.allIsTrue(this.aniArr)) {
            return;
        }

        // 重置动画记录器
        this.aniArr = [];

        this.$items.each((index, item) => {
            const $item = $(item);
            const $nextItem = $item.next().length ? $item.next() : this.$items.first();
            const $prevItem = $item.prev().length ? $item.prev() : this.$items.last();
            const $targetItem = dir === 'right' ? $nextItem : $prevItem;
            const targetLeft = $targetItem.css('left');
            const targetTop = $targetItem.css('top');
            const targetWidth = $targetItem.css('width');
            const targetHeight = $targetItem.css('height');
            const targetIndex = $targetItem.css('zIndex');
            const targetOpacity = $targetItem.css('opacity');
            const $cloneItem = dir === 'right' ? $prevItem : $nextItem;

            // 为了正常衔接，右移前，将最右侧项内容变更为其前一项
            if (this.isRepair && dir === 'right' && parseInt(targetLeft, 10) === 0) {
                $item.attr('data-crs-index', $cloneItem.attr('data-crs-index')).html($cloneItem.html());
            }

            // 为了正常衔接，左移前，将最左侧项内容变更为其后一项
            if (this.isRepair && dir === 'left' && parseInt($item.css('left'), 10) === 0) {
                $item.attr('data-crs-index', $cloneItem.attr('data-crs-index')).html($cloneItem.html());
            }

            // 记录层级
            zIndexArr.push(targetIndex);

            // 标识当前项正在动画
            this.aniArr[index] = true;

            // 执行动画
            $item.animate({
                opacity: targetOpacity,
                left: targetLeft,
                top: targetTop,
                width: targetWidth,
                height: targetHeight,
            }, this.setting.duration, () => {
                // 标识当前项已经完成动画
                this.aniArr[index] = false;
            });
        });

        this.$items.each((index, item) => {
            const zIndex = zIndexArr[index];

            // 调整层级
            $(item).css({
                zIndex
            });

            // 当前分页项高亮
            if (+zIndex === +this.firstItemZIndex) {
                const pageIndex = $(item).attr('data-crs-index');
                this.$pageItems.removeClass('crs-page-item-active')
                    .eq(pageIndex).addClass('crs-page-item-active');
                this.setting.onChange(pageIndex, $(item));
            }
        });
    }

    // 所有是否为 true，可用 Array.every 代替
    static allIsTrue(list) {
        const arr = list || [];
        for (let i = 0; i < arr.length; i += 1) {
            if (arr[i]) {
                return true;
            }
        }
        return false;
    }

    // 开始自动播放
    startPlay() {
        if (this.setting.autoPlay) {
            this.stopPlay();
            this.timer = setInterval(() => {
                this.move();
            }, this.setting.interval);
        }
    }

    // 停止自动播放
    stopPlay() {
        clearInterval(this.timer);
    }
}

function Lcrs(selector, options) {
    if (!window.jQuery) {
        return;
    }

    const $selector = $(selector);
    if (!$selector.length) {
        return;
    }

    $selector.each((index, item) => {
        new Crs($(item), options);
    });
}

// export default Lcrs;

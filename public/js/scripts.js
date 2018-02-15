/**
 * Created by Dima on 1/20/2018.
 */

(function($) {
    "use strict";

    $(document).ready(function () {

        var api_url = 'https://stylemixthemes.scdn2.secure.raxcdn.com/api/prices.json';

        $.ajax({
            url: api_url,
            dataType: 'json',
            context: this,
            complete: function (data) {
                var r = data.responseJSON;
                $('.stm_price_api').text(r.themes.crypterio.price);
            }
        });

        $('.go_bot').click(function(e){
            e.preventDefault();
            var anchor = $(this);
            var name = anchor.attr('href').replace(new RegExp("/#",'gi'), '');
            $('html, body').stop().animate({
                scrollTop: $(name).offset().top
            }, 700);
            e.preventDefault();
            return false;
        });

        $('select').select2();

        $('body').each(function () {
            if ( $( "#iframe" ).length ) {
                $(this).addClass('has_iframe');
            };
        });

        $('.stm_close_iframe').on('click', function () {
            $('body').removeClass('has_iframe');
            $('.float-buy-btn').removeClass('none');
            $('#iframe').hide();
            return false;
        });

        var h = parseInt($('.banner-wrap').height()) + parseInt($('.header').height()) + parseInt($('.demos-wrap').height());

        if(! /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ) {
            stm_animate_block();
        }

        jQuery(window).scroll(function(){
            if(! /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ){
                stm_animate_block();
                /*if($(window).scrollTop() + $(window).height() > h) {
                    $(".arrow_top").addClass("arrowShow");
                }

                if($(window).scrollTop() === 0) {
                    $(".arrow_top").removeClass("arrowShow");
                }*/
            } else{
                $(".stm_animation").css('opacity', 1);
            }
        });

        $(".arrow_top").on("click", function () {1
            toTop();
        });

        $('#theme-select a').on('click', function () {
            $('#theme-list ul').toggle();
            $('#theme-list').toggleClass('list-opened');
            return false;
        });

        $('#theme-list ul a').click(function () {
            $('#theme-select').html($(this).closest('li').html());
            $('#theme-list ul').hide();
        });

        $("#header-bar").hide();
        var clicked = "desktop";
        var device;
        var t = {
            desktop: "100%",
            tabletlandscape: 1040,
            tabletportrait: 788,
            mobilelandscape: 500,
            mobileportrait: 340,
            placebo: 0
        };

        iframeTop();
        showThemeScreen();

        $(window).load(function () {
            showThemeScreen();
        });

        $(window).resize(function () {
            iframeTop();
        });
    });

    function toTop() {
        var scroll_pos=(0);
        $('html, body').animate({scrollTop:(scroll_pos)}, '5000', function () {
            $(".arrow_top").removeClass("arrowShow");
        });
    }

    function iframeTop() {
        var topBarHeight = $('#switcher').outerHeight();
        $('#iframe').css({
            'top': topBarHeight + 'px',
        })
    }

    function showThemeScreen() {
        var theme = '';
        var top = 0;
        $('#switcher #theme-list ul li').hover(
            function () {
                theme = $(this).data('theme');
                top = $(this).offset().top;
                $('#' + theme).addClass('active');
                $('.theme-list-screens').css({
                    'top': top + 'px'
                });

                var $listScreen = $('#' + theme + ' a');
                if ($listScreen.attr('data-loaded') === 'false') {

                    var stmSrc = $listScreen.attr('data-img');
                    $listScreen.append('<img src="' + stmSrc + '" />');

                    $listScreen.attr('data-loaded', 'true');
                }


            }, function () {
                $('#' + theme).removeClass('active');
            }
        );
    }

    function stm_animate_block(){
        jQuery('.stm_animation').each(function(){
            if(jQuery(this).attr('data-animate')) {
                var animation_blocks = jQuery(this);
                var animationName = jQuery(this).attr('data-animate'),
                    animationDuration = jQuery(this).attr('data-animation-duration') + 's',
                    animationDelay = jQuery(this).attr('data-animation-delay');
                var style = 'opacity:1;-webkit-animation-delay:'+animationDelay+'s;-webkit-animation-duration:'+animationDuration+'; -moz-animation-delay:'+animationDelay+'s;-moz-animation-duration:'+animationDuration+'; animation-delay:'+animationDelay+'s;';
                var container_style = 'opacity:1;-webkit-transition-delay: '+(animationDelay)+'s; -moz-transition-delay: '+(animationDelay)+'s; transition-delay: '+(animationDelay)+'s;';
                if (isAppear(jQuery(this))) {
                    jQuery(this).attr( 'style', container_style );
                    jQuery.each( animation_blocks, function(index,value){
                        jQuery(this).attr('style', style);
                        jQuery(this).addClass('animated').addClass(animationName);
                    });
                }
            }
        });
    }

    function isAppear(id) {
        var window_scroll = jQuery(window).scrollTop();
        var window_height = jQuery(window).height();

        if (jQuery(id).hasClass('stm_viewport')) {
            var start_effect = jQuery(id).data('viewport_position');
        }

        if (typeof(start_effect) === 'undefined' || start_effect == '') {
            var percentage = 2;
        }else {
            var percentage = 100 - start_effect;
        }
        var element_top = jQuery(id).offset().top;
        var position = element_top - window_scroll;

        var cut = window_height - (window_height * (percentage / 100));
        if (position <= cut) {
            return true;
        }else {
            return false;
        }
    }

})(jQuery);
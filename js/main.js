$(document).ready(function() {
    $('#grid').isotope({
        itemSelector: '.item',
        layoutMode: 'fitRows'
    });

    $('body').fadeIn(1000);

    $("#grid").isotope("layout");
    $("#grid").isotope('shuffle');

    $(".sign-up-btn").click(function() {
        $(".row.form").addClass("overlay");
        $(".sign-up-form").css('visibility', 'visible').hide().fadeIn(1000);
    });

    $(".sign-up-form .close").click(function() {
        $(".row.form.overlay").removeClass("overlay");
        $(".sign-up-form").css('visibility', 'visible').hide().fadeOut(1000);
    });
});

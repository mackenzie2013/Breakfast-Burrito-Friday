$(document).ready(function() {
    $('#grid').isotope({
        itemSelector: '.item',
        layoutMode: 'fitRows'
    });

    $('body').fadeIn(1000);

    $("#grid").isotope("layout");
    $("#grid").isotope('shuffle');

    $(".sign-up-btn").click(function() {
        $(".sign-up-form").css('visibility', 'visible').hide().fadeIn(1000);
    });

   
});

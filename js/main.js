$(document).ready(function() {
    $('#grid').isotope({
        itemSelector: '.item',
        layoutMode: 'fitRows'
    });

    $("#grid").isotope("layout");
    $("#grid").isotope('shuffle');
});

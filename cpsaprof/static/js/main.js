/*global $*/
/*global CPSAClient*/
/*global CPSADataStore*/
/*global CPSAAggregatorSql*/
/*global CPSAViewSql*/
/*global CPSAViewRequest*/
/*global CPSAViewSqlAggregated*/

var cpsa_client = new CPSAClient(),
    cpsa_datastore = new CPSADataStore(),
    cpsa_aggregator_sql = new CPSAAggregatorSql(),
    cpsa_view_sql = new CPSAViewSql(),
    cpsa_view_request = new CPSAViewRequest(),
    cpsa_view_sql_aggregated = new CPSAViewSqlAggregated();

cpsa_datastore.listen(cpsa_client);
cpsa_aggregator_sql.listen(cpsa_datastore);

cpsa_view_sql.listen(cpsa_datastore);
cpsa_view_request.listen(cpsa_datastore);
cpsa_view_sql_aggregated.listen(cpsa_aggregator_sql);

function add_control_handlers() {
    $('#start').click(cpsa_client.start);
    $('#stop').click(cpsa_client.stop);
    $('#clear').click(cpsa_datastore.clear);

    cpsa_client.subscribe('start', function() {
        $('#start').prop("disabled", true);
        $('#stop').prop("disabled", false);
    });

    cpsa_client.subscribe('stop', function() {
        $('#start').prop("disabled", false);
        $('#stop').prop("disabled", true);
    });

    cpsa_datastore.subscribe('clear', function() {
        $('#clear').prop("disabled", true);
    });

    cpsa_datastore.subscribe('add_sql', function(data) {
        $('#clear').prop("disabled", false);
    });

    cpsa_datastore.subscribe('add_request', function(data) {
        $('#clear').prop("disabled", false);
    });
}


var _current_view;
var VIEWS = {
    sql: cpsa_view_sql,
    request: cpsa_view_request,
    sql_aggregated: cpsa_view_sql_aggregated,
};
function show_view(type, search) {
    // If the view is already displayed, do nothing
    var view = VIEWS[type];
    if (_current_view == view) return;

    if (_current_view !== undefined) {
        _current_view.remove();
    }
    view.display($('#container'), search);
    _current_view = view;

    $('.view_selected').removeClass('view_selected');
    $(`#view_${type}`).addClass('view_selected');
}


function add_link_handlers() {
    $(document).on('click', '.view_link', function(e) {
        // Don't go anywhere...
        e.preventDefault();
        e.stopPropagation();

        var $el = $(this);
        show_view($el.data('type'), $el.data('id'));
    });
}


$(function() {
    add_control_handlers();
    add_link_handlers();
    show_view('sql');
});

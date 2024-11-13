for ( tbl of document.querySelectorAll("table.tableblock") ) {
  new JSTable(tbl, {
    sortable: true,
    searchable: false,
    addQueryParams: false,
    layout: { bottom: "" },
  })
}

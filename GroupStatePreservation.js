//var $ = $telerik.$;
var ClApps_Common;
(function (ClApps_Common) {
    (function (Extenders) {
        (function (Telerik) {
            (function (RadGrid) {
                (function (GroupStatePreservation) {
                    var Options = (function () {
                        function Options(gridClientID, saveGridScrollPosition, groupByExpression_SecondColumnDisplayName, clientDataSource_AddEventHandlers, ajaxRefresh_AddEventHandlers) {
                            if (typeof saveGridScrollPosition === "undefined") { saveGridScrollPosition = true; }
                            if (typeof groupByExpression_SecondColumnDisplayName === "undefined") { groupByExpression_SecondColumnDisplayName = null; }
                            if (typeof clientDataSource_AddEventHandlers === "undefined") { clientDataSource_AddEventHandlers = false; }
                            if (typeof ajaxRefresh_AddEventHandlers === "undefined") { ajaxRefresh_AddEventHandlers = false; }
                            this.gridClientID = gridClientID;
                            this.saveGridScrollPosition = saveGridScrollPosition;
                            this.groupByExpression_SecondColumnDisplayName = groupByExpression_SecondColumnDisplayName;
                            this.clientDataSource_AddEventHandlers = clientDataSource_AddEventHandlers;
                            this.ajaxRefresh_AddEventHandlers = ajaxRefresh_AddEventHandlers;
                        }
                        return Options;
                    })();
                    GroupStatePreservation.Options = Options;

                    var Core = (function () {
                        function Core(_Options) {
                            this._Options = _Options;
                            //#region Group Expand State Tracking
                            this._groupsExpanded = [];
                            this._groupsCollapsed = [];
                            this._gridScrollTop = 0;
                            this._InitializeExtender();
                        }
                        Core.prototype.get_Options = function () {
                            return this._Options;
                        };

                        Core.prototype._InitializeExtender = function () {
                            if (this._Options.clientDataSource_AddEventHandlers) {
                                this._InitializeExtender_ClientSideData();
                            } else if (this._Options.ajaxRefresh_AddEventHandlers) {
                                this._InitializeExtender_AjaxRefresh();
                            }
                        };

                        //#region AJAX Refresh Event Handlers
                        Core.prototype._InitializeExtender_AjaxRefresh = function () {
                            var _this = this;
                            var prmInstance = Sys.WebForms.PageRequestManager.getInstance();
                            if (!prmInstance)
                                return;
                            prmInstance.add_beginRequest(function (sender, args) {
                                return _this._PageRequestManager_BeginRequest(sender, args);
                            });
                            prmInstance.add_endRequest(function (sender, args) {
                                return _this._PageRequestManager_EndRequest(sender, args);
                            });
                        };
                        Core.prototype._PageRequestManager_BeginRequest = function (sender, args) {
                            this.SaveGrouping();
                        };
                        Core.prototype._PageRequestManager_EndRequest = function (sender, args) {
                            this.RestoreGrouping();
                        };

                        //#endregion
                        //#region Client Data Source Event Handlers
                        Core.prototype._InitializeExtender_ClientSideData = function () {
                            var _this = this;
                            var grid = this.get_Grid();
                            grid.add_command(function (sender, args) {
                                return _this._Grid_OnCommand(sender, args);
                            });
                            grid.add_dataBound(function (sender, args) {
                                return _this._Grid_OnDataBound(sender, args);
                            });
                        };
                        Core.prototype._Grid_OnCommand = function (sender, args) {
                            this.SaveGrouping();
                        };
                        Core.prototype._Grid_OnDataBound = function (sender, args) {
                            this.RestoreGrouping();
                        };

                        //#endregion
                        Core.prototype.get_Grid = function () {
                            return ($find(this._Options.gridClientID));
                        };
                        Core.prototype.get_$GridDataElement = function () {
                            var gridDataElement = $("#" + this._Options.gridClientID + "_GridData");
                            if (gridDataElement.length === 1) {
                                return gridDataElement;
                            }
                            return null;
                        };
                        Core.prototype.get_GridMasterTableView = function (grid) {
                            if (!grid) {
                                grid = this.get_Grid();
                            }
                            try  {
                                return grid.get_masterTableView();
                            } catch (err) {
                                if (console && typeof console.log === "function") {
                                    console.log("RadGrid Group State Preservation: MasterTableView missing/error.");
                                }
                            }
                        };

                        //#region Save
                        Core.prototype.SaveGrouping = function () {
                            this._groupsExpanded = [];
                            this._groupsCollapsed = [];

                            var gridDataElement = this.get_$GridDataElement();
                            if (gridDataElement) {
                                this._gridScrollTop = gridDataElement.get(0).scrollTop;
                            }

                            var masterTableView = this.get_GridMasterTableView();
                            if (!masterTableView)
                                return;

                            var thisClass = this;

                            $(masterTableView.get_element()).find("tr.rgGroupHeader").find("td").each(function () {
                                var groupState = thisClass._get_GroupState(this);
                                if (groupState) {
                                    if (groupState.IsExpanded) {
                                        thisClass._groupsExpanded.push(groupState.GroupText);
                                    } else {
                                        thisClass._groupsCollapsed.push(groupState.GroupText);
                                    }
                                }
                            });
                        };

                        //#endregion
                        //#region Restore
                        Core.prototype.RestoreGrouping = function () {
                            if (this._groupsExpanded.length === 0)
                                return;

                            var masterTableView = this.get_GridMasterTableView();
                            if (!masterTableView)
                                return;

                            var thisClass = this;
                            $(masterTableView.get_element()).find("tr.rgGroupHeader").find("td").each(function () {
                                var groupState = thisClass._get_GroupState(this);
                                if (groupState) {
                                    if (groupState.IsExpanded && thisClass._groupsCollapsed.indexOf(groupState.GroupText) !== -1) {
                                        groupState.ExpandCollapseButtonElement.click();
                                    } else if (!groupState.IsExpanded && thisClass._groupsExpanded.indexOf(groupState.GroupText) !== -1) {
                                        groupState.ExpandCollapseButtonElement.click();
                                    }
                                }
                            });

                            var gridDataElement = this.get_$GridDataElement();
                            if (gridDataElement) {
                                gridDataElement.get(0).scrollTop = this._gridScrollTop;
                            }
                        };

                        //#endregion
                        Core.prototype._get_GroupState = function (groupHeaderTDElement) {
                            var tdElement = ($(groupHeaderTDElement)[0]);
                            var tdElement_FirstChild = (tdElement.firstChild);
                            if (tdElement_FirstChild !== null && tdElement_FirstChild.tagName === "INPUT") {
                                var $tdElement_FirstChild = $(tdElement_FirstChild);
                                if ($tdElement_FirstChild.hasClass("rgExpand") || $tdElement_FirstChild.hasClass("rgCollapse")) {
                                    var IsExpanded = $tdElement_FirstChild.hasClass("rgCollapse");
                                    var tdElement_NextSibling = (tdElement.nextSibling);
                                    if (tdElement_NextSibling !== null) {
                                        var GroupText = tdElement_NextSibling.innerText;
                                        if (this._Options.groupByExpression_SecondColumnDisplayName) {
                                            GroupText = GroupText.substring(0, GroupText.indexOf("; " + this._Options.groupByExpression_SecondColumnDisplayName));
                                        }
                                        return {
                                            IsExpanded: IsExpanded,
                                            GroupText: GroupText,
                                            ExpandCollapseButtonElement: (tdElement.firstChild)
                                        };
                                    }
                                }
                            }
                            return null;
                        };
                        return Core;
                    })();
                    GroupStatePreservation.Core = Core;
                })(RadGrid.GroupStatePreservation || (RadGrid.GroupStatePreservation = {}));
                var GroupStatePreservation = RadGrid.GroupStatePreservation;
            })(Telerik.RadGrid || (Telerik.RadGrid = {}));
            var RadGrid = Telerik.RadGrid;
        })(Extenders.Telerik || (Extenders.Telerik = {}));
        var Telerik = Extenders.Telerik;
    })(ClApps_Common.Extenders || (ClApps_Common.Extenders = {}));
    var Extenders = ClApps_Common.Extenders;
})(ClApps_Common || (ClApps_Common = {}));

var Grid_GroupStatePreservation;
function ApplicationLoaded() {
    var GroupStatePreservation_Options = new ClApps_Common.Extenders.Telerik.RadGrid.GroupStatePreservation.Options("RadGrid1");

    //GroupStatePreservation_Options.groupByExpression_SecondColumnDisplayName = "Tickets";
    Grid_GroupStatePreservation = new ClApps_Common.Extenders.Telerik.RadGrid.GroupStatePreservation.Core(GroupStatePreservation_Options);
}

function RadAjaxManager1_requestStart(sender, eventArgs) {
    Grid_GroupStatePreservation.SaveGrouping();
}
function RadAjaxManager1_responseEnd(sender, eventArgs) {
    Grid_GroupStatePreservation.RestoreGrouping();
}
//# sourceMappingURL=GroupStatePreservation.js.map

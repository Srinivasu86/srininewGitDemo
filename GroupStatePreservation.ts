//var $ = $telerik.$;

module ClApps_Common.Extenders.Telerik.RadGrid.GroupStatePreservation {
	export class Options {
		constructor(public gridClientID: string,
			public saveGridScrollPosition: boolean = true,
			public groupByExpression_SecondColumnDisplayName: string = null,
			public clientDataSource_AddEventHandlers: boolean = false,
			public ajaxRefresh_AddEventHandlers: boolean = false) {

		}
	}

	interface GroupState {
		IsExpanded: boolean;
		GroupText: string;
		ExpandCollapseButtonElement: HTMLInputElement;
	}

	export class Core {
		constructor(private _Options: Options) {
			this._InitializeExtender();
		}

		public get_Options() {
			return this._Options;
		}

		private _InitializeExtender() {
			if (this._Options.clientDataSource_AddEventHandlers) {
				this._InitializeExtender_ClientSideData();
			} else if (this._Options.ajaxRefresh_AddEventHandlers) {
				this._InitializeExtender_AjaxRefresh();
			}
		}

		//#region AJAX Refresh Event Handlers
		private _InitializeExtender_AjaxRefresh() {
			var prmInstance = Sys.WebForms.PageRequestManager.getInstance();
			if (!prmInstance)
				return;
			prmInstance.add_beginRequest((sender, args) => this._PageRequestManager_BeginRequest(sender, args));
			prmInstance.add_endRequest((sender, args) => this._PageRequestManager_EndRequest(sender, args));

		}
		private _PageRequestManager_BeginRequest(sender, args) {
			this.SaveGrouping();
		}
		private _PageRequestManager_EndRequest(sender, args) {
			this.RestoreGrouping();
		}
		//#endregion

		//#region Client Data Source Event Handlers
		private _InitializeExtender_ClientSideData() {
			var grid = this.get_Grid();
			grid.add_command((sender, args) => this._Grid_OnCommand(sender, args));
			grid.add_dataBound((sender, args) => this._Grid_OnDataBound(sender, args));
		}
		private _Grid_OnCommand(sender, args) {
			this.SaveGrouping();
		}
		private _Grid_OnDataBound(sender, args) {
			this.RestoreGrouping();
		}
		//#endregion

		get_Grid() {
			return <Telerik.Web.UI.RadGrid>($find(this._Options.gridClientID));
		}
		get_$GridDataElement(): JQuery {
			var gridDataElement = $("#" + this._Options.gridClientID + "_GridData");
			if (gridDataElement.length === 1) {
				return gridDataElement;
			}
			return null;
		}
		get_GridMasterTableView(grid?: Telerik.Web.UI.RadGrid): Telerik.Web.UI.GridTableView {
			if (!grid) {
				grid = this.get_Grid();
			}
			try {
				return grid.get_masterTableView();
			} catch (err) {
				if (console && typeof console.log === "function") {
					console.log("RadGrid Group State Preservation: MasterTableView missing/error.");
				}
			}
		}
		
		//#region Group Expand State Tracking
		private _groupsExpanded: Array<string> = [];
		private _groupsCollapsed: Array<string> = [];
		private _gridScrollTop: number = 0;

		//#region Save
		SaveGrouping() {
			this._groupsExpanded = [];
			this._groupsCollapsed = [];

			var gridDataElement = this.get_$GridDataElement();
			if (gridDataElement) {
				this._gridScrollTop = gridDataElement.get(0).scrollTop;
			}

			var masterTableView = this.get_GridMasterTableView();
			if (!masterTableView) return;

			var thisClass = this;

			$(masterTableView.get_element()).find("tr.rgGroupHeader").find("td").each(
				function () {
					var groupState = thisClass._get_GroupState(this);
					if (groupState) {
						if (groupState.IsExpanded) {
							thisClass._groupsExpanded.push(groupState.GroupText);
						} else {
							thisClass._groupsCollapsed.push(groupState.GroupText);
						}
					}
				});
		}
		//#endregion

		//#region Restore
		RestoreGrouping() {
			if (this._groupsExpanded.length === 0)
				return;

			var masterTableView = this.get_GridMasterTableView();
			if (!masterTableView) return;

			var thisClass = this;
			$(masterTableView.get_element()).find("tr.rgGroupHeader").find("td").each(
				function () {
					var groupState = thisClass._get_GroupState(this);
					if (groupState) {
						if (groupState.IsExpanded
							&& thisClass._groupsCollapsed.indexOf(groupState.GroupText) !== -1) {
							groupState.ExpandCollapseButtonElement.click();
						} else if (!groupState.IsExpanded
							&& thisClass._groupsExpanded.indexOf(groupState.GroupText) !== -1) {
							groupState.ExpandCollapseButtonElement.click();
						}
					}
				});

			var gridDataElement = this.get_$GridDataElement();
			if (gridDataElement) {
				gridDataElement.get(0).scrollTop = this._gridScrollTop;
			}
		}
		//#endregion

		private _get_GroupState(groupHeaderTDElement: HTMLTableCellElement): GroupState {
			var tdElement = <HTMLTableCellElement>($(groupHeaderTDElement)[0]);
			var tdElement_FirstChild = <HTMLElement>(tdElement.firstChild);
			if (tdElement_FirstChild !== null
				&& tdElement_FirstChild.tagName === "INPUT") {
				var $tdElement_FirstChild = $(tdElement_FirstChild);
				if ($tdElement_FirstChild.hasClass("rgExpand")
					|| $tdElement_FirstChild.hasClass("rgCollapse")) {
					var IsExpanded: boolean = $tdElement_FirstChild.hasClass("rgCollapse");
					var tdElement_NextSibling = <HTMLElement>(tdElement.nextSibling);
					if (tdElement_NextSibling !== null) {
						var GroupText = tdElement_NextSibling.innerText;
						if (this._Options.groupByExpression_SecondColumnDisplayName) {
							GroupText = GroupText.substring(
								0, GroupText.indexOf("; " + this._Options.groupByExpression_SecondColumnDisplayName));
						}
						return {
							IsExpanded: IsExpanded,
							GroupText: GroupText,
							ExpandCollapseButtonElement: (<HTMLInputElement>(tdElement.firstChild))
						};
					}
				}
			}
			return null;
		}
		//#endregion
	}
}

var Grid_GroupStatePreservation: ClApps_Common.Extenders.Telerik.RadGrid.GroupStatePreservation.Core;
function ApplicationLoaded(): void {
	var GroupStatePreservation_Options = new ClApps_Common.Extenders.Telerik.RadGrid.GroupStatePreservation.Options("RadGrid1");
	//GroupStatePreservation_Options.groupByExpression_SecondColumnDisplayName = "Tickets";
	Grid_GroupStatePreservation = new ClApps_Common.Extenders.Telerik.RadGrid.GroupStatePreservation.Core(GroupStatePreservation_Options);
}

function RadAjaxManager1_requestStart(sender, eventArgs): void {
	Grid_GroupStatePreservation.SaveGrouping();
}
function RadAjaxManager1_responseEnd(sender, eventArgs): void {
	Grid_GroupStatePreservation.RestoreGrouping();
}
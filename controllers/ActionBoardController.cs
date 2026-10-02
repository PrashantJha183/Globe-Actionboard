//using RSuite.Infrastructure.Core.Context;
//using RSuite.Infrastructure.Core.Logger;
//using RSuite.Infrastructure.Specification.Common.DAL;
//using RSuite.Infrastructure.Specification.Common.Reports;
//using RSuite.UserInterface.Web.Mvc.AppCode.Service.ActionBoard;
//using RSuite.UserInterface.Web.Mvc.Models.Common.ActionBoard;
//using System.Data;
//using RSuite.Domain.Common.Reports;
//using RSuite.Web.Base;
//using System;
//using System.Collections.Generic;
//using System.Threading.Tasks;
//using System.Web.Mvc;
//using RSuite.Web;
//using RSuite.Infrastructure.Core.Base;
//using System.Linq;
//using RSuite.Repository.Common;
//using RSuite.UserInterface.Web.Mvc.AppCode.Common.Factory;
//using RSuite.UserInterface.Web.Mvc.AppCode.Service;
//using RSuite.Infrastructure.Specification.Common.Link;
//using RSuite.Domain.Common.Link;
//using RSuite.Domain.Common.Finance;
//using RSuite.Infrastructure.Specification.Common.Finance;
//using RSuite.Infrastructure.Core.Helper;

//namespace RSuite.UserInterface.Web.Mvc.Controllers.Common
//{
//    public class ActionBoardController : BaseController
//    {
//        private readonly ActionBoardService _service;
//        private readonly ILoginContextService _loginContextService;
//        private readonly IReportingService _reportingService;
//        private readonly IFinancialYearService _financialYearService;
//        IDAL _dal;

//        public ActionBoardController(
//            IDAL DAL,
//            ILoginContextService LoginContextService,
//            IReportingService ReportingService,
//            IFinancialYearService FinancialYearService)
//        {
//            _dal = DAL;
//            _loginContextService = LoginContextService;
//            _reportingService = ReportingService;
//            _service = new ActionBoardService(_dal);
//            _financialYearService = FinancialYearService;
//        }

//        public async Task<ActionResult> Index()
//        {
//            try
//            {
//                var vm = await Task.Run(() => _service.GetDashboardData());
//                vm.ActiveTab = vm.NavigationTabs != null && vm.NavigationTabs.Count > 0
//                    ? vm.NavigationTabs[0].Name
//                    : "";
//                vm.Cards = new List<PendingTaskCard>();
//                return View("~/_ActionBoard/views/ActionBoardView.cshtml", vm);
//            }
//            catch (Exception ex)
//            {
//                EntityFactory.GetInstance<IErrorLogger>().LogError("ActionBoard.Index", ex);
//                var fallback = new ActionBoardViewModel
//                {
//                    Name = "Pending Tasks Dashboard",
//                    Description = "Centralized dashboard for all pending ERP approvals and operational actions.",
//                    FontFamily = "Verdana, sans-serif",
//                    SupportedModes = new[] { "light", "dark" },
//                    DesignSystem = "Liquid Glass",
//                    NavigationTabs = new List<NavigationTab>(),
//                    Cards = new List<PendingTaskCard>()
//                };
//                return View("~/_ActionBoard/views/ActionBoardView.cshtml", fallback);
//            }
//        }

//        [System.Web.Mvc.HttpGet]
//        public async Task<ActionResult> GetCards(int groupId)
//        {
//            try
//            {
//                var userId = _loginContextService.GetLoginContext().UserId;
//                var cards = await Task.Run(() => _service.GetCards(groupId, userId));
//                //cards = cards.OrderBy(c => c.DisplayOrder).ToList();
//                return Json(new { success = true, data = cards }, JsonRequestBehavior.AllowGet);


//            }
//            catch (Exception ex)
//            {
//                EntityFactory.GetInstance<IErrorLogger>().LogError("ActionBoard.GetCards", ex);
//                return Json(new { success = false, message = "Unable to load pending tasks. Please try again." }, JsonRequestBehavior.AllowGet);
//            }
//        }

//        private void setlogincontext(LoginContext lc)
//        {
//            _loginContextService.SetLoginContext(lc.UserId, lc.LoginName, lc.LocationId, lc.YearCode, lc.CompanyId);
//        }

//        [System.Web.Mvc.HttpGet]
//        public async Task<ActionResult> RunWorkFlowApproval(int configId, int reportId)
//        {
//            try
//            {
//                int linkId = 0;
//                int linkItemId = 0;

//                if (configId > 0)
//                {
//                    var configDs = new DataSet();
//                    _dal.RunQuery("SELECT LinkId, LinkItemId FROM ActionBoardConfig WHERE ActionBoardConfigId = " + configId, ref configDs);

//                    if (configDs.Tables.Count > 0 && configDs.Tables[0].Rows.Count > 0)
//                    {
//                        var row = configDs.Tables[0].Rows[0];
//                        if (row["LinkId"] != DBNull.Value)
//                            linkId = Convert.ToInt32(row["LinkId"]);

//                        if (row["LinkItemId"] != DBNull.Value)
//                            linkItemId = Convert.ToInt32(row["LinkItemId"]);
//                    }
//                }

//                if (linkId > 0 && linkItemId > 0)
//                {
//                    LinkItem linkItem = EntityFactory.GetInstance<IQueryExecutor>()
//                        .ExecuteQuery<LinkItem>("Uid = " + linkId, 0, 0)
//                        .FirstOrDefault();

//                    if (linkItem == null)
//                        return Json(new { success = false, message = "LinkItem not found." }, JsonRequestBehavior.AllowGet);

//                    if (string.IsNullOrEmpty(linkItem.AddUrl))
//                        return Json(new { success = false, message = "AddUrl not configured for this LinkItem." }, JsonRequestBehavior.AllowGet);

//                    string AddUrl = linkItem.AddUrl;
//                    LoginContext lcl = _loginContextService.GetLoginContext();
//                    FinancialYear fy = _financialYearService.GetFinancialYearByCode(lcl.YearCode, lcl.CompanyId);
//                    string fromDate = fy.FinancialStartDate.ToString("dd/MM/yyyy");
//                    string toDate = DateTime.Now.Date.ToString("dd/MM/yyyy");
//                    string separator = AddUrl.Contains("?") ? "&" : "?";
//                    string url = AddUrl + separator
//                        + "LinkId=" + linkId
//                        + "&LinkItemId=" + linkItemId
//                        + "&FromDate=" + Uri.EscapeDataString(fromDate)
//                        + "&ToDate=" + Uri.EscapeDataString(toDate)
//                        + "&IsByPassDataFetchOnLoad=0";
//                    string fullUrl = Url.Content("~/" + url);

//                    return Json(new
//                    {
//                        success = true,
//                        url = fullUrl,
//                        isForm = true,
//                        windowTitle = linkItem.LinkItemName ?? "Task"
//                    }, JsonRequestBehavior.AllowGet);
//                }

//                if (reportId <= 0)
//                    return Json(new { success = false, message = "Invalid report configuration." }, JsonRequestBehavior.AllowGet);

//                var ctx = System.Web.HttpContext.Current;
//                var lc = _loginContextService.GetLoginContext();
//                IQueryExecutor queryExecutor = EntityFactory.GetInstance<IQueryExecutor>();
//                ReportQueryService reportQueryExecutor = EntityFactory.GetInstance<ReportQueryService>();
//                Report report = queryExecutor.ExecuteQuery<Report>("ReportId = " + reportId, 0, 0).FirstOrDefault();

//                if (report == null)
//                    return Json(new { success = false, message = "Report not found." }, JsonRequestBehavior.AllowGet);

//                int reportLinkId = report.ReferenceLinkId;
//                report = reportQueryExecutor.GetReportByReferenceLinkId(reportLinkId);
//                IList<ReportColumn> reportColumns = new List<ReportColumn>();
//                foreach(ReportColumn rc in report.ReportColumnCollection)
//                {
//                    ReportColumn addRC = new ReportColumn();
//                    CoreHelper.LoadData(rc, addRC);
//                    addRC.Uid = 0;
//                    SessionDataHandler.AddToCollection(addRC, reportColumns);
//                }

//                if (reportColumns.Count == 0)
//                    return Json(new { success = false, message = "No report columns configured." }, JsonRequestBehavior.AllowGet);

//                ReportColumn addUrl = new ReportColumn();
//                addUrl.ReportColumnId = 16657;
//                addUrl.TableColumnName = "AddUrl";
//                addUrl.DisplayColumnName = "AddUrl";
//                addUrl.IsDefaultColumn = true;
//                addUrl.DataType = "string";
//                addUrl.IsSqlParameter = false;
//                addUrl.ReportId = 940;
//                addUrl.GroupType = "";
//                addUrl.GroupIndex = 0;
//                addUrl.SearchQuery = "";
//                addUrl.SrNo = 25;
//                addUrl.IsFilterColumn = true;
//                SessionDataHandler.AddToCollection(addUrl, reportColumns);

//                var result = await Task.Run(() =>
//                {
//                    System.Web.HttpContext.Current = ctx;
//                    setlogincontext(lc);

//                    DataSet reportData = _reportingService.GenerateReport(reportLinkId, report.Code, report.ReportFilterColumnCollection, reportColumns);

//                    string sessionKey = "AB_Rpt_" + reportId + "_" + DateTime.Now.Ticks;
//                    SessionDataHandler.Save(sessionKey, reportData);
//                    string url = Url.Action("Index", "Report", new { SessionKey = sessionKey, LinkId = reportLinkId, UserId = lc.UserId, ReportId = reportId });
//                    return new { sessionKey, url };
//                });

//                return Json(new { success = true, url = result.url, isForm = false }, JsonRequestBehavior.AllowGet);
//            }
//            catch (Exception ex)
//            {
//                EntityFactory.GetInstance<IErrorLogger>()
//                    .LogError("ActionBoard.RunWorkFlowApproval", ex);

//                return Json(new
//                {
//                    success = false,
//                    message = "An error occurred while processing your request. Please try again."
//                }, JsonRequestBehavior.AllowGet);
//            }
//        }

//        [HttpGet]
//        public async Task<ActionResult> GetAddUrlByLinkId(int linkId)
//        {
//            try
//            {
//                if (linkId <= 0)
//                    return Json(new { success = false, message = "Invalid LinkId." }, JsonRequestBehavior.AllowGet);

//                var linkService = EntityFactory.GetInstance<ILinkService>();
//                LinkItem linkItem = await Task.Run(() => linkService.GetLinkItem(linkId));

//                if (linkItem == null)
//                    return Json(new { success = false, message = "LinkItem not found." }, JsonRequestBehavior.AllowGet);

//                var linkUrlService = new LinkUrlService();
//                string url = linkUrlService.GetAddUrl(linkId);
//                return Json(new { itemUrl = url, itemId = linkId, itemName = linkItem.LinkItemName ?? "" }, JsonRequestBehavior.AllowGet);
//            }
//            catch (Exception ex)
//            {
//                EntityFactory.GetInstance<IErrorLogger>().LogError("ActionBoard.GetAddUrlByLinkId", ex);
//                return Json(new { success = false, message = "An error occurred." }, JsonRequestBehavior.AllowGet);
//            }
//        }
//    }
//}




using RSuite.Infrastructure.Core.Context;
using RSuite.Infrastructure.Core.Logger;
using RSuite.Infrastructure.Specification.Common.DAL;
using RSuite.Infrastructure.Specification.Common.Reports;
using RSuite.UserInterface.Web.Mvc.AppCode.Service.ActionBoard;
using RSuite.UserInterface.Web.Mvc.Models.Common.ActionBoard;
using System.Data;
using RSuite.Domain.Common.Reports;
using RSuite.Web.Base;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Web.Mvc;
using RSuite.Web;
using RSuite.Infrastructure.Core.Base;
using System.Linq;
using RSuite.Repository.Common;
using RSuite.UserInterface.Web.Mvc.AppCode.Common.Factory;
using RSuite.UserInterface.Web.Mvc.AppCode.Service;
using RSuite.Infrastructure.Specification.Common.Link;
using RSuite.Domain.Common.Link;
using RSuite.Domain.Common.Finance;
using RSuite.Infrastructure.Specification.Common.Finance;
using RSuite.Infrastructure.Core.Helper;

namespace RSuite.UserInterface.Web.Mvc.Controllers.Common
{
    public class ActionBoardController : BaseController
    {
        private readonly ActionBoardService _service;
        private readonly ILoginContextService _loginContextService;
        private readonly IReportingService _reportingService;
        private readonly IFinancialYearService _financialYearService;
        IDAL _dal;

        public ActionBoardController(
            IDAL DAL,
            ILoginContextService LoginContextService,
            IReportingService ReportingService,
            IFinancialYearService FinancialYearService)
        {
            _dal = DAL;
            _loginContextService = LoginContextService;
            _reportingService = ReportingService;
            _service = new ActionBoardService(_dal);
            _financialYearService = FinancialYearService;
        }

        public async Task<ActionResult> Index()
        {
            try
            {
                var vm = await Task.Run(() => _service.GetDashboardData());
                vm.ActiveTab = vm.NavigationTabs != null && vm.NavigationTabs.Count > 0
                    ? vm.NavigationTabs[0].Name
                    : "";
                vm.Cards = new List<PendingTaskCard>();
                return View("~/_ActionBoard/views/ActionBoardView.cshtml", vm);
            }
            catch (Exception ex)
            {
                EntityFactory.GetInstance<IErrorLogger>().LogError("ActionBoard.Index", ex);
                var fallback = new ActionBoardViewModel
                {
                    Name = "Pending Tasks Dashboard",
                    Description = "Centralized dashboard for all pending ERP approvals and operational actions.",
                    FontFamily = "Verdana, sans-serif",
                    SupportedModes = new[] { "light", "dark" },
                    DesignSystem = "Liquid Glass",
                    NavigationTabs = new List<NavigationTab>(),
                    Cards = new List<PendingTaskCard>()
                };
                return View("~/_ActionBoard/views/ActionBoardView.cshtml", fallback);
            }
        }

        [System.Web.Mvc.HttpGet]
        public async Task<ActionResult> GetCards(int groupId)
        {
            try
            {
                var userId = _loginContextService.GetLoginContext().UserId;
                var cards = await Task.Run(() => _service.GetCards(groupId, userId));
                //cards = cards.OrderBy(c => c.DisplayOrder).ToList();
                return Json(new { success = true, data = cards }, JsonRequestBehavior.AllowGet);


            }
            catch (Exception ex)
            {
                EntityFactory.GetInstance<IErrorLogger>().LogError("ActionBoard.GetCards", ex);
                return Json(new { success = false, message = "Unable to load pending tasks. Please try again." }, JsonRequestBehavior.AllowGet);
            }
        }

        private void setlogincontext(LoginContext lc)
        {
            _loginContextService.SetLoginContext(lc.UserId, lc.LoginName, lc.LocationId, lc.YearCode, lc.CompanyId);
        }

        /* GetLinkNavigationResult: Path 1 — resolves LinkId/LinkItemId from ActionBoardConfig and builds dynamic URL */
        private object GetLinkNavigationResult(int configId)
        {
            try
            {
                if (configId <= 0) return null;

                var configDs = new DataSet();
                _dal.RunQuery("SELECT LinkId, LinkItemId FROM ActionBoardConfig WHERE ActionBoardConfigId = " + configId, ref configDs);

                if (configDs.Tables.Count == 0 || configDs.Tables[0].Rows.Count == 0)
                    return null;

                var row = configDs.Tables[0].Rows[0];
                var linkId = row["LinkId"] != DBNull.Value ? Convert.ToInt32(row["LinkId"]) : 0;
                var linkItemId = row["LinkItemId"] != DBNull.Value ? Convert.ToInt32(row["LinkItemId"]) : 0;

                if (linkId <= 0 || linkItemId <= 0) return null;

                var linkItem = EntityFactory.GetInstance<IQueryExecutor>()
                    .ExecuteQuery<LinkItem>("Uid = " + linkId, 0, 0).FirstOrDefault();

                if (linkItem == null)
                    return new { success = false, message = "LinkItem not found." };

                if (string.IsNullOrEmpty(linkItem.AddUrl))
                    return new { success = false, message = "AddUrl not configured for this LinkItem." };

                var lcl = _loginContextService.GetLoginContext();
                var fy = _financialYearService.GetFinancialYearByCode(lcl.YearCode, lcl.CompanyId);
                var separator = linkItem.AddUrl.Contains("?") ? "&" : "?";
                var url = linkItem.AddUrl + separator
                    + "LinkId=" + linkId
                    + "&LinkItemId=" + linkItemId
                    + "&FromDate=" + Uri.EscapeDataString(fy.FinancialStartDate.ToString("dd/MM/yyyy"))
                    + "&ToDate=" + Uri.EscapeDataString(DateTime.Now.Date.ToString("dd/MM/yyyy"))
                    + "&IsByPassDataFetchOnLoad=0";

                return new
                {
                    success = true,
                    url = Url.Content("~/" + url),
                    isForm = true,
                    windowTitle = linkItem.LinkItemName ?? "Task"
                };
            }
            catch (Exception ex)
            {
                EntityFactory.GetInstance<IErrorLogger>().LogError("ActionBoard.GetLinkNavigationResult", ex);
                return new { success = false, message = "Failed to resolve link navigation." };
            }
        }

        /* GenerateReportResultAsync: Path 2 — builds report columns, generates report, saves to session, returns URL */
        private async Task<object> GenerateReportResultAsync(int reportId)
        {
            try
            {
                var ctx = System.Web.HttpContext.Current;
                var lc = _loginContextService.GetLoginContext();
                var queryExecutor = EntityFactory.GetInstance<IQueryExecutor>();
                var reportQueryExecutor = EntityFactory.GetInstance<ReportQueryService>();

                var report = queryExecutor.ExecuteQuery<Report>("ReportId = " + reportId, 0, 0).FirstOrDefault();
                if (report == null)
                    return new { success = false, message = "Report not found." };

                var reportLinkId = report.ReferenceLinkId;
                report = reportQueryExecutor.GetReportByReferenceLinkId(reportLinkId);

                var reportColumns = new List<ReportColumn>();
                foreach (ReportColumn rc in report.ReportColumnCollection)
                {
                    var addRC = new ReportColumn();
                    CoreHelper.LoadData(rc, addRC);
                    addRC.Uid = 0;
                    SessionDataHandler.AddToCollection(addRC, reportColumns);
                }

                if (reportColumns.Count == 0)
                    return new { success = false, message = "No report columns configured." };

                var addUrl = new ReportColumn
                {
                    ReportColumnId = 16657,
                    TableColumnName = "AddUrl",
                    DisplayColumnName = "AddUrl",
                    IsDefaultColumn = true,
                    DataType = "string",
                    IsSqlParameter = false,
                    ReportId = 940,
                    GroupType = "",
                    GroupIndex = 0,
                    SearchQuery = "",
                    SrNo = 25,
                    IsFilterColumn = true
                };
                SessionDataHandler.AddToCollection(addUrl, reportColumns);

                var result = await Task.Run(() =>
                {
                    System.Web.HttpContext.Current = ctx;
                    setlogincontext(lc);
                    var reportData = _reportingService.GenerateReport(reportLinkId, report.Code, report.ReportFilterColumnCollection, reportColumns);
                    var sessionKey = "AB_Rpt_" + reportId + "_" + DateTime.Now.Ticks;
                    SessionDataHandler.Save(sessionKey, reportData);
                    var url = Url.Action("Index", "Report", new { SessionKey = sessionKey, LinkId = reportLinkId, UserId = lc.UserId, ReportId = reportId });
                    return new { sessionKey, url };
                });

                return new { success = true, url = result.url, isForm = false };
            }
            catch (Exception ex)
            {
                EntityFactory.GetInstance<IErrorLogger>().LogError("ActionBoard.GenerateReportResult", ex);
                return new { success = false, message = "Failed to generate report." };
            }
        }

        [System.Web.Mvc.HttpGet]
        public async Task<ActionResult> RunWorkFlowApproval(int configId, int reportId)
        {
            try
            {
                var cfgDs = new DataSet();
                _dal.RunQuery("SELECT ActionBoardGroupId, SequenceNo FROM ActionBoardConfig WHERE ActionBoardConfigId = " + configId, ref cfgDs);
                if (cfgDs.Tables.Count > 0 && cfgDs.Tables[0].Rows.Count > 0)
                {
                    var cr = cfgDs.Tables[0].Rows[0];
                    if (Convert.ToInt32(cr["ActionBoardGroupId"]) == 3 && Convert.ToInt32(cr["SequenceNo"]) == 2)
                        return Json(GetTransferApprovalNavigationResult(configId), JsonRequestBehavior.AllowGet);
                }

                var linkResult = GetLinkNavigationResult(configId);
                if (linkResult != null)
                    return Json(linkResult, JsonRequestBehavior.AllowGet);

                if (reportId <= 0)
                    return Json(new { success = false, message = "Invalid report configuration." }, JsonRequestBehavior.AllowGet);

                var reportResult = await GenerateReportResultAsync(reportId);
                return Json(reportResult, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                EntityFactory.GetInstance<IErrorLogger>()
                    .LogError("ActionBoard.RunWorkFlowApproval", ex);

                return Json(new
                {
                    success = false,
                    message = "An error occurred while processing your request. Please try again."
                }, JsonRequestBehavior.AllowGet);
            }
        }

        //[HttpGet]
        //public async Task<ActionResult> GetAddUrlByLinkId(int linkId)
        //{
        //    try
        //    {
        //        if (linkId <= 0)
        //            return Json(new { success = false, message = "Invalid LinkId." }, JsonRequestBehavior.AllowGet);

        //        var linkService = EntityFactory.GetInstance<ILinkService>();
        //        LinkItem linkItem = await Task.Run(() => linkService.GetLinkItem(linkId));

        //        if (linkItem == null)
        //            return Json(new { success = false, message = "LinkItem not found." }, JsonRequestBehavior.AllowGet);

        //        var linkUrlService = new LinkUrlService();
        //        string url = linkUrlService.GetAddUrl(linkId);
        //        return Json(new { itemUrl = url, itemId = linkId, itemName = linkItem.LinkItemName ?? "" }, JsonRequestBehavior.AllowGet);
        //    }
        //    catch (Exception ex)
        //    {
        //        EntityFactory.GetInstance<IErrorLogger>().LogError("ActionBoard.GetAddUrlByLinkId", ex);
        //        return Json(new { success = false, message = "An error occurred." }, JsonRequestBehavior.AllowGet);
        //    }
        //}



        [HttpGet]
        public async Task<ActionResult> GetAddUrlByLinkId(int linkId)
        {
            try
            {
                if (linkId <= 0)
                    return Json(new { success = false, message = "Invalid LinkId." }, JsonRequestBehavior.AllowGet);

                var ctx = System.Web.HttpContext.Current;
                var lc = _loginContextService.GetLoginContext();

                string itemName = null;

                string url = await Task.Run(() =>
                {
                    System.Web.HttpContext.Current = ctx;
                    setlogincontext(lc);

                    var linkService = EntityFactory.GetInstance<ILinkService>();
                    LinkItem linkItem = linkService.GetLinkItem(linkId);
                    if (linkItem == null)
                        return null;

                    itemName = linkItem.LinkItemName ?? "";

                    var linkUrlService = new LinkUrlService();
                    return linkUrlService.GetAddUrl(linkId);
                });

                if (url == null)
                    return Json(new { success = false, message = "LinkItem not found." }, JsonRequestBehavior.AllowGet);

                return Json(new { itemUrl = url, itemId = linkId, itemName = itemName ?? "" }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                EntityFactory.GetInstance<IErrorLogger>().LogError("ActionBoard.GetAddUrlByLinkId", ex);
                return Json(new { success = false, message = "An error occurred." }, JsonRequestBehavior.AllowGet);
            }
        }

        /* GetTransferApprovalNavigationResult: Path 3 — builds TransferApproval form URL for groupId=3, seqNo=2 */
        private object GetTransferApprovalNavigationResult(int configId)
        {
            try
            {
                var cfgDs = new DataSet();
                _dal.RunQuery("SELECT LinkId FROM ActionBoardConfig WHERE ActionBoardConfigId = " + configId, ref cfgDs);
                if (cfgDs.Tables.Count == 0 || cfgDs.Tables[0].Rows.Count == 0)
                    return new { success = false, message = "Config not found." };

                var linkId = Convert.ToInt32(cfgDs.Tables[0].Rows[0]["LinkId"]);
                if (linkId <= 0)
                    return new { success = false, message = "LinkId not configured." };

                var linkItem = EntityFactory.GetInstance<IQueryExecutor>()
                    .ExecuteQuery<LinkItem>("Uid = " + linkId, 0, 0).FirstOrDefault();

                if (linkItem == null || string.IsNullOrEmpty(linkItem.AddUrl))
                    return new { success = false, message = "LinkItem or AddUrl not found." };

                string queryadd = linkItem.QueryString;

                var lcl = _loginContextService.GetLoginContext();
                var fy = _financialYearService.GetFinancialYearByCode(lcl.YearCode, lcl.CompanyId);
                var sep = linkItem.AddUrl.Contains("?") ? "&" : "?";

                var url = linkItem.AddUrl + sep + "KeyId=0" + "&LinkId=" + linkId + "&FormMode=0" + queryadd + "&TermSetId=0" + "&Isredirect=1" + "&FromDate=" + Uri.EscapeDataString(fy.FinancialStartDate.ToString("dd/MM/yyyy")) + "&ToDate=" + Uri.EscapeDataString(DateTime.Now.Date.ToString("dd/MM/yyyy"));

                return new
                {
                    success = true,
                    url = Url.Content("~/" + url),
                    isForm = true,
                    windowTitle = linkItem.LinkItemName ?? "Transfer Approval"
                };
            }
            catch (Exception ex)
            {
                EntityFactory.GetInstance<IErrorLogger>().LogError("ActionBoard.GetTransferApprovalNavigationResult", ex);
                return new { success = false, message = "Failed to generate transfer approval link." };
            }
        }

    }
}


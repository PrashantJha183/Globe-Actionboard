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


        //[System.Web.Mvc.HttpGet]
        //public async Task<ActionResult> RunCardReport(int reportId)
        //{
        //    try
        //    {
        //        if (reportId <= 0)
        //            return Json(new { success = false, message = "Invalid report configuration." },
        //                        JsonRequestBehavior.AllowGet);

        //        var ctx = System.Web.HttpContext.Current;
        //        var lc = _loginContextService.GetLoginContext();

        //        IQueryExecutor queryExecutor = EntityFactory.GetInstance<IQueryExecutor>();
        //        ReportQueryService reportQueryExecutor = EntityFactory.GetInstance<ReportQueryService>();
        //        Report report = queryExecutor.ExecuteQuery<Report>("ReportId = " + reportId, 0, 0).FirstOrDefault();
        //        report = reportQueryExecutor.GetReportByReferenceLinkId(report.ReferenceLinkId);

        //        var result = await Task.Run(() =>
        //        {
        //            System.Web.HttpContext.Current = ctx;
        //            setlogincontext(lc);  

        //            DataSet reportData = _reportingService.GenerateReport(report.ReferenceLinkId, report.Code, report.ReportFilterColumnCollection, report.ReportColumnCollection);

        //            string sessionKey = "AB_Rpt_" + reportId + "_" + DateTime.Now.Ticks;
        //            SessionDataHandler.Save(sessionKey, reportData);
        //            string url = Url.Action("Index", "Report", new { SessionKey = sessionKey, LinkId = report.ReferenceLinkId, UserId = lc.UserId, ReportId = reportId });
        //            return new { sessionKey, url };
        //        });
      
        //        return Json(new { success = true, url = result.url }, JsonRequestBehavior.AllowGet);
        //    }
        //    catch (InvalidOperationException ex)
        //    {
        //        EntityFactory.GetInstance<IErrorLogger>()
        //            .LogError("ActionBoard.RunCardReport.Config", ex);
        //        return Json(new { success = false, message = ex.Message },
        //                    JsonRequestBehavior.AllowGet);
        //    }
        //    catch (Exception ex)
        //    {
        //        EntityFactory.GetInstance<IErrorLogger>()
        //            .LogError("ActionBoard.RunCardReport", ex);
        //        return Json(new { success = false, message = ex.Message },
        //                    JsonRequestBehavior.AllowGet);
        //    }
        //}

        [System.Web.Mvc.HttpGet]
        public async Task<ActionResult> RunWorkFlowApproval(int configId, int reportId)
        {
            try
            {
                int linkId = 0;
                int linkItemId = 0;

                if (configId > 0)
                {
                    var configDs = new DataSet();
                    _dal.RunQuery("SELECT LinkId, LinkItemId FROM ActionBoardConfig WHERE ActionBoardConfigId = " + configId, ref configDs);

                    if (configDs.Tables.Count > 0 && configDs.Tables[0].Rows.Count > 0)
                    {
                        var row = configDs.Tables[0].Rows[0];
                        if (row["LinkId"] != DBNull.Value)
                            linkId = Convert.ToInt32(row["LinkId"]);

                        if (row["LinkItemId"] != DBNull.Value)
                            linkItemId = Convert.ToInt32(row["LinkItemId"]);
                    }
                }

                if (linkId > 0 && linkItemId > 0)
                {
                    LinkItem linkItem = EntityFactory.GetInstance<IQueryExecutor>()
                        .ExecuteQuery<LinkItem>("Uid = " + linkId, 0, 0)
                        .FirstOrDefault();

                    if (linkItem == null)
                        return Json(new { success = false, message = "LinkItem not found." }, JsonRequestBehavior.AllowGet);

                    string addUrl = linkItem.AddUrl ?? "";
                    LoginContext lcl = _loginContextService.GetLoginContext();
                    FinancialYear fy = _financialYearService.GetFinancialYearByCode(lcl.YearCode, lcl.CompanyId);
                    string fromDate = fy.FinancialStartDate.ToString("dd/MM/yyyy");
                    string toDate = DateTime.Now.Date.ToString("dd/MM/yyyy");
                    string separator = addUrl.Contains("?") ? "&" : "?";
                    string url = addUrl + separator
                        + "LinkId=" + linkId
                        + "&LinkItemId=" + linkItemId
                        + "&FromDate=" + Uri.EscapeDataString(fromDate)
                        + "&ToDate=" + Uri.EscapeDataString(toDate)
                        + "&IsByPassDataFetchOnLoad=0";
                    string fullUrl = Url.Content("~/" + url);

                    return Json(new
                    {
                        success = true,
                        url = fullUrl,
                        isForm = true,
                        windowTitle = linkItem.LinkItemName ?? "Task"
                    }, JsonRequestBehavior.AllowGet);
                }

                if (reportId <= 0)
                    return Json(new { success = false, message = "Invalid report configuration." }, JsonRequestBehavior.AllowGet);

                var ctx = System.Web.HttpContext.Current;
                var lc = _loginContextService.GetLoginContext();
                IQueryExecutor queryExecutor = EntityFactory.GetInstance<IQueryExecutor>();
                ReportQueryService reportQueryExecutor = EntityFactory.GetInstance<ReportQueryService>();
                Report report = queryExecutor.ExecuteQuery<Report>("ReportId = " + reportId, 0, 0).FirstOrDefault();

                if (report == null)
                    return Json(new { success = false, message = "Report not found." }, JsonRequestBehavior.AllowGet);

                int reportLinkId = report.ReferenceLinkId;
                report = reportQueryExecutor.GetReportByReferenceLinkId(reportLinkId);

                var result = await Task.Run(() =>
                {
                    System.Web.HttpContext.Current = ctx;
                    setlogincontext(lc);

                    DataSet reportData = _reportingService.GenerateReport(reportLinkId, report.Code, report.ReportFilterColumnCollection, report.ReportColumnCollection);

                    string sessionKey = "AB_Rpt_" + reportId + "_" + DateTime.Now.Ticks;
                    SessionDataHandler.Save(sessionKey, reportData);
                    string url = Url.Action("Index", "Report", new { SessionKey = sessionKey, LinkId = reportLinkId, UserId = lc.UserId, ReportId = reportId });
                    return new { sessionKey, url };
                });

                return Json(new { success = true, url = result.url, isForm = false }, JsonRequestBehavior.AllowGet);
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

        /* OLD:
        [HttpGet]
        public ActionResult GetAddUrlByLinkId(int linkId)
        {
            var linkService = EntityFactory.GetInstance<ILinkService>();
            var linkItem = linkService.GetLinkItem(linkId);
            var linkUrlService = new LinkUrlService();
            string url = linkUrlService.GetAddUrl(linkId);
            return Json(new { itemUrl = url, itemId = linkId, itemName = linkItem.LinkItemName ?? "" }, JsonRequestBehavior.AllowGet);
        }
        */

        [HttpGet]
        public async Task<ActionResult> GetAddUrlByLinkId(int linkId)
        {
            try
            {
                if (linkId <= 0)
                    return Json(new { success = false, message = "Invalid LinkId." }, JsonRequestBehavior.AllowGet);

                var linkService = EntityFactory.GetInstance<ILinkService>();
                LinkItem linkItem = await Task.Run(() => linkService.GetLinkItem(linkId));

                if (linkItem == null)
                    return Json(new { success = false, message = "LinkItem not found." }, JsonRequestBehavior.AllowGet);

                var linkUrlService = new LinkUrlService();
                string url = linkUrlService.GetAddUrl(linkId);
                return Json(new { itemUrl = url, itemId = linkId, itemName = linkItem.LinkItemName ?? "" }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                EntityFactory.GetInstance<IErrorLogger>().LogError("ActionBoard.GetAddUrlByLinkId", ex);
                return Json(new { success = false, message = "An error occurred." }, JsonRequestBehavior.AllowGet);
            }
        }
    }
}

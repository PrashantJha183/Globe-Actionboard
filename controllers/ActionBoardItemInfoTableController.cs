using System.Data;
using System.Web.Mvc;
using RSuite.Infrastructure.Core.Base;
using RSuite.Web.Base;
using RSuite.Web;

namespace RSuite.UserInterface.Web.Mvc.Controllers.Common
{
    public class ActionBoardItemInfoTableController : BaseController
    {
        public ActionResult Grid(string sessionKey)
        {
            if (string.IsNullOrEmpty(sessionKey))
                return Content("Invalid session key.");

            DataSet ds = SessionDataHandler.Get(sessionKey) as DataSet;
            if (ds == null || ds.Tables.Count == 0)
                return Content("Report data not found or session expired.");

            /* Card name used to name the Excel download. Stored alongside the
               dataset in GenerateReportResultAsync under the same sessionKey,
               so it expires with the data. Null when the entry is missing or
               the card had no name; the view emits an empty attribute and the
               export falls back to a generic name. Passed via ViewBag so the
               DataSet model is left untouched, and never travels in the URL. */
            ViewBag.CardTitle = SessionDataHandler.Get(sessionKey + "_CardTitle") as string;

            return View("~/_ActionBoard/views/ActionBoardItemInfoTableView.cshtml", ds);
        }

        public ActionResult Loading()
        {
            return View("~/_ActionBoard/views/ActionBoardLoading.cshtml");
        }
    }
}

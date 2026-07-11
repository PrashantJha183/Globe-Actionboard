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

            return View("~/_ActionBoard/views/ActionBoardItemInfoTableView.cshtml", ds);
        }

        public ActionResult Loading()
        {
            return View("~/_ActionBoard/views/ActionBoardLoading.cshtml");
        }
    }
}

using RSuite.Infrastructure.Core.Base;
using RSuite.Infrastructure.Core.Context;
using RSuite.Infrastructure.Core.Logger;
using RSuite.Infrastructure.Specification.Common.DAL;
using RSuite.UserInterface.Web.Mvc.AppCode.Common.Factory;
using RSuite.UserInterface.Web.Mvc.Models.Common.ActionBoard;
using System;
using System.Collections.Generic;
using System.Data;
using System.Linq;

namespace RSuite.UserInterface.Web.Mvc.AppCode.Service.ActionBoard
{
    public class ActionBoardService
    {
        private readonly IDAL _dal;

        public ActionBoardService(IDAL dal)
        {
            _dal = dal;
        }

        public List<NavigationTab> GetNavigationTabs()
        {
            try
            {
                var ds = new DataSet();
                _dal.RunQuery("SELECT ActionBoardGroupId, ActionBoardGroupName, SequenceNo FROM ActionBoardGroup ORDER BY SequenceNo", ref ds);

                if (ds.Tables.Count == 0 || ds.Tables[0].Rows.Count == 0)
                    return new List<NavigationTab>();

                return ds.Tables[0].AsEnumerable().Select((row, index) =>
                {
                    try
                    {
                        return new NavigationTab
                        {
                            Id = Convert.ToInt32(row["ActionBoardGroupId"]),
                            Name = row["ActionBoardGroupName"]?.ToString() ?? "",
                            IsDefault = index == 0
                        };
                    }
                    catch
                    {
                        return new NavigationTab { Id = 0, Name = "", IsDefault = false };
                    }
                }).ToList();
            }
            catch (Exception ex)
            {
                EntityFactory.GetInstance<IErrorLogger>().LogError("ActionBoard.GetNavigationTabs", ex);
                return new List<NavigationTab>();
            }
        }

        public List<PendingTaskCard> GetCards(int groupId, int userId)
        {
            try
            {
                var ds = new DataSet();
                var p = new[]
                {
                    _dal.MakeInParams("@ActionBoardGroupId", DbType.Int32, 4, groupId),
                    _dal.MakeInParams("@UserId", DbType.Int32, 4, userId)
                };
                _dal.RunProc("usp_GetActionboarddata", p, ref ds);

                if (ds.Tables.Count == 0 || ds.Tables[0].Rows.Count == 0)
                    return new List<PendingTaskCard>();

                var cards = ds.Tables[0].AsEnumerable().Select(row =>
                {
                    try
                    {
                        return new PendingTaskCard
                        {
                            Id = Convert.ToInt32(row["ActionBoardConfigId"]),
                            Title = row["ActionBoardConfigName"]?.ToString() ?? "",
                            Count = row["Count"] != DBNull.Value ? Convert.ToInt32(row["Count"]) : 0,
                            DisplayOrder = row["SequenceNo"] != DBNull.Value ? Convert.ToInt32(row["SequenceNo"]) : 0,
                            Icon = "fa-file-text-o"
                        };
                    }
                    catch (Exception ex)
                    {
                        EntityFactory.GetInstance<IErrorLogger>().LogError("ActionBoard.GetCards.RowMapping", ex);
                        return new PendingTaskCard
                        {
                            Id = 0, Title = "", Count = 0, Icon = "fa-file-text-o"
                        };
                    }
                }).ToList();

var configIds = string.Join(",", cards.Where(c => c.Id > 0).Select(c => c.Id));
                if (!string.IsNullOrEmpty(configIds))
                {
                    var iconDs = new DataSet();

                    if (groupId == 1)
                    {
                        _dal.RunQuery("SELECT ActionBoardConfigId, Icon, ReportId FROM ActionBoardConfig WHERE ActionBoardConfigId IN (" + configIds + ")", ref iconDs);
                    }
                    else
                    {
                        _dal.RunQuery(@"
SELECT c.ActionBoardConfigId, c.Icon, c.ReportId,
       ISNULL(SUM(d.Amount), 0) AS Amount
FROM ActionBoardConfig c
LEFT JOIN ActionBoardConfigDisplay d ON c.ActionBoardConfigId = d.ActionBoardConfigId
WHERE c.ActionBoardConfigId IN (" + configIds + @")
GROUP BY c.ActionBoardConfigId, c.Icon, c.ReportId", ref iconDs);
                    }

                    if (iconDs.Tables.Count > 0 && iconDs.Tables[0].Rows.Count > 0)
                    {
                        var iconMap = new Dictionary<int, string>();
                        var reportIdMap = new Dictionary<int, int>();
                        Dictionary<int, decimal> amountMap = groupId != 1 ? new Dictionary<int, decimal>() : null;
                        foreach (DataRow r in iconDs.Tables[0].Rows)
                        {
                            var id = Convert.ToInt32(r["ActionBoardConfigId"]);
                            iconMap[id] = r["Icon"]?.ToString() ?? "fa-file-text-o";
                            if (r["ReportId"] != DBNull.Value)
                                reportIdMap[id] = Convert.ToInt32(r["ReportId"]);
                            if (amountMap != null && r["Amount"] != DBNull.Value)
                                amountMap[id] = Convert.ToDecimal(r["Amount"]);
                        }
                        foreach (var card in cards)
                        {
                            if (card.Id > 0 && iconMap.ContainsKey(card.Id))
                                card.Icon = iconMap[card.Id];
                            if (card.Id > 0 && reportIdMap.ContainsKey(card.Id))
                                card.ReportId = reportIdMap[card.Id];
                            if (amountMap != null && card.Id > 0 && amountMap.ContainsKey(card.Id))
                                card.Amount = amountMap[card.Id];
                        }
                    }
                }

                return cards;
            }
            catch (Exception ex)
            {
                EntityFactory.GetInstance<IErrorLogger>().LogError("ActionBoard.GetCards", ex);
                return new List<PendingTaskCard>();
            }
        }

        public ActionBoardViewModel GetDashboardData()
        {
            return new ActionBoardViewModel
            {
                Name = "Pending Tasks Dashboard",
                Description = "Centralized dashboard for all pending ERP approvals and operational actions.",
                FontFamily = "Verdana, sans-serif",
                SupportedModes = new[] { "light", "dark" },
                DesignSystem = "Liquid Glass",
                NavigationTabs = GetNavigationTabs(),
                Cards = new List<PendingTaskCard>()
            };
        }
    }
}

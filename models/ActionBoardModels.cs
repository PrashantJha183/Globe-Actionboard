using System.Collections.Generic;

namespace RSuite.UserInterface.Web.Mvc.Models.Common.ActionBoard
{
    public class ActionBoardViewModel
    {
        public string Name { get; set; }
        public string Description { get; set; }
        public string FontFamily { get; set; }
        public string[] SupportedModes { get; set; }
        public string DesignSystem { get; set; }
        public List<NavigationTab> NavigationTabs { get; set; }
        public string ActiveTab { get; set; }
        public List<PendingTaskCard> Cards { get; set; }
    }

    public class NavigationTab
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public bool IsDefault { get; set; }
    }

    public class PendingTaskCard
    {
        public int Id { get; set; }
        public string Module { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public int Count { get; set; }
        public string Priority { get; set; }
        public string PriorityColor { get; set; }
        public string Icon { get; set; }
        public string IconColor { get; set; }
        public string Route { get; set; }
        public string LastUpdated { get; set; }
        public bool IsActive { get; set; }
        public int DisplayOrder { get; set; }
        public string CardType { get; set; }
        public int ReportId { get; set; }
        public decimal Amount { get; set; }
        public int Frequency { get; set; }  // in minutes, 0 = no cooldown for refresh btn

    }
}
# Task notification: Mark as Complete API

The UI calls:

`POST https://api.urest.in:8096/api/notification/task/complete`

Payload (JSON):

```json
{
  "taskId": 1392,
  "questId": 0,
  "taskDate": "2026-05-27T00:00:00.000Z",
  "propertyId": 26,
  "taskStatus": "Completed"
}
```

## Suggested Web API 2 action (C#)

Add this method inside your existing `NotificationController` (`[RoutePrefix("api/notification")]`).

```csharp
public class TaskCompleteRequest
{
    public int TaskId { get; set; }
    public int QuestId { get; set; } = 0;        // 0 = overall task
    public DateTime TaskDate { get; set; }       // date user is marking complete for
    public int PropertyId { get; set; }
    public string TaskStatus { get; set; } = "Completed";
}

[HttpPost]
[Route("task/complete")]
public async Task<IHttpActionResult> MarkTaskComplete([FromBody] TaskCompleteRequest req)
{
    if (req == null) return BadRequest("Missing payload.");
    if (req.PropertyId <= 0) return BadRequest("Invalid propertyId.");
    if (req.TaskId <= 0) return BadRequest("Invalid taskId.");
    if (string.IsNullOrWhiteSpace(req.TaskStatus)) req.TaskStatus = "Completed";

    // normalize to date (your SQL query uses CAST(updatedon AS date))
    var day = req.TaskDate.Date;

    try
    {
        using (var con = new SqlConnection(constr))
        {
            await con.OpenAsync();

            var sql = @"
IF EXISTS (
    SELECT 1
    FROM taskwisedailystatusfinaldashreco
    WHERE TaskID = @TaskId
      AND QuestID = @QuestId
      AND PropertyId = @PropertyId
      AND CAST(updatedon AS date) = @Day
)
BEGIN
    UPDATE taskwisedailystatusfinaldashreco
    SET TaskStatus = @TaskStatus,
        updatedon = GETDATE()
    WHERE TaskID = @TaskId
      AND QuestID = @QuestId
      AND PropertyId = @PropertyId
      AND CAST(updatedon AS date) = @Day;
END
ELSE
BEGIN
    INSERT INTO taskwisedailystatusfinaldashreco (TaskID, TaskName, QuestID, Remarks, updatedon, TaskStatus, TaskPriority, TaskPriorityId, CategoryId, SubCategoryId, AssignTo, Occurence, PropertyId)
    VALUES (@TaskId, '', @QuestId, 'All', GETDATE(), @TaskStatus, 0, 0, 0, 0, 0, '', @PropertyId);
END
";

            using (var cmd = new SqlCommand(sql, con))
            {
                cmd.Parameters.AddWithValue("@TaskId", req.TaskId);
                cmd.Parameters.AddWithValue("@QuestId", req.QuestId);
                cmd.Parameters.AddWithValue("@PropertyId", req.PropertyId);
                cmd.Parameters.AddWithValue("@TaskStatus", req.TaskStatus);
                cmd.Parameters.AddWithValue("@Day", day);

                var rows = await cmd.ExecuteNonQueryAsync();
                return Ok(new { success = true, rowsAffected = rows });
            }
        }
    }
    catch (Exception ex)
    {
        return InternalServerError(new Exception("Error updating task status: " + ex.Message));
    }
}
```

Notes:
- If you already have `CategoryId/SubCategoryId/AssignTo/Occurence/...` available, prefer inserting real values (or remove the INSERT and require the row to exist).
- If you want the task to disappear from `GET /api/notification/task`, you likely also need to update the source table used there (your current query filters `TaskNotification.CurrentStatus = 'Actionable'`).


import ServiceProvider from '../../Common/ServiceProvider.js';
let srv = new ServiceProvider();
class DataProvider {
    manageCategory(model, type) {
        let url = '';
        switch (type) {
            case 'C':
                url = `Calendar/Category/Save`;
                return srv.CallPostService(url, model[0]);
            case 'U':
                url = `Calendar/Category/Save`;
                return srv.CallPostService(url, model[0]);
            case 'D':
                url = `Calendar/Category/Delete/${model[0].CatId}/${model[0].CmdType}`;
                return srv.CallPostService(url);
            case 'R':
                url = `Calendar/Category/List/${model[0].CmdType}`;
                return srv.get(url);
            default:
        }
    }
    manageFrequency(model, type) {
        let url = '';
        let data = model[0];

        switch (type) {
            case 'C': // Create
                url = `api/master/addFrequency`;
                return srv.CallPostNewService(url, data);

            case 'U': // Update
                url = `api/master/updateFrequency/${data.Id}`;
                return srv.CallPutService(url, data);

            case 'D': // Delete
                url = `api/master/deleteFrequency/${data.Id}`;
                return srv.CallDeleteNewService(url);

            default:
                throw new Error("Invalid operation type");
        }
    }

    manageSubCategory(model, type,categoryId) {
        let url = '';
        switch (type) {
            case 'C':
                url = `CreateSubCategory`;
                return srv.CallPostNewService(url, model[0]);
            case 'R':
                url = `GetCategory?categoryId=${categoryId}`;
                return srv.getComplaint(url);
            case 'D':
                {
                    const raw = model?.[0] || {};
                    const subCategoryId =
                        raw.subCategoryId ?? raw.SubCategoryId ?? raw.subCatID ?? raw.subCatId ?? raw.id ?? 0;
                    url = `DeleteSubCategory?subCategoryId=${subCategoryId}`;
                    return srv.CallPostNewService(url);
                }
            default:
        }
    }

    manageTask(model, type) {
    let url = ''; // declare only once at the top

    switch (type) {
        case 'C':
            url = `CreateTask`;
            return srv.CallPostNewService(url, model[0]);

        case 'U':
            url = `Calendar/Category/Save`;
            return srv.CallPostService(url, model[0]);

        case 'D':
            url = `DeleteTask?taskID=${model[0].TaskId}`;
            return srv.CallDeleteNewService(url, model[0]);

        case 'R':
            {
                const params = new URLSearchParams();
                params.set("catID", model[0].CategoryId ?? 0);
                params.set("subCatID", model[0].SubCategoryId ?? 0);
                params.set("assingedtoID", model[0].AssignedTo ?? 0);
                params.set("occurrence", model[0].Occurrence ?? 0);
                if (model[0].DteFr) params.set("dteFr", model[0].DteFr);
                if (model[0].DteTo) params.set("dteTo", model[0].DteTo);
                if (model[0].TaskStatus) params.set("taskstatus", model[0].TaskStatus);
                params.set("propID", model[0].PropertyId ?? 0);
                if (model[0].TaskPriority) params.set("taskPriorityId", model[0].TaskPriority);

                // Paging is optional. If omitted, API can return full dataset.
                const pageNumber = Number(model[0].PageNumber);
                const pageSize = Number(model[0].PageSize);
                if (Number.isFinite(pageNumber) && pageNumber > 0) params.set("pageNumber", pageNumber);
                if (Number.isFinite(pageSize) && pageSize > 0) params.set("pageSize", pageSize);

                url = `TaskDetails?${params.toString()}`;
                return srv.getComplaint(url);
            }

        case 'SR':
            url = `TaskDetailsWithQuestion?catID=${model[0].CategoryId}&subCatID=${model[0].SubCategoryId}&assingedtoID=${model[0].AssignedTo}&occurrence=${model[0].Occurrence}&dteFr=${model[0].DteFr}&dteTo=${model[0].DteTo}`;
            return srv.getComplaint(url);

        case 'T':
            url = `TaskDetails?catID=${model[0].CategoryId}&subCatID=${model[0].SubCategoryId}&assingedtoID=${model[0].AssignedTo}&occurrence=${model[0].Occurrence}`;
            return srv.getComplaint(url);

        case 'TaskWithQuestionName':
            url = `TaskDetailsWithQuestion?catID=${model[0].CategoryId}&subCatID=${model[0].SubCategoryId}&assingedtoID=${model[0].AssignedTo}&occurrence=${model[0].Occurrence}`;
            return srv.getComplaint(url);

        case 'GetAllTaskWiseSummary':
            // ✅ Fix: don't redeclare "let url"
            url = 'GetAllTaskWiseSummary?';
            for (let key in model[0]) {
                if (model[0].hasOwnProperty(key)) {
                    url += `${key}=${model[0][key]}&`;
                }
            }
            if (url.endsWith('&')) {
                url = url.slice(0, -1);
            }
            return srv.getComplaint(url);

        case 'GetAllTaskWiseStatusFinalDash':
            url = `GetAllTaskWiseStatusFinalDash?categoryId=${model[0].catId}&occurance=${model[0].occurance}&dateFrom=${model[0].dateFrom}&dateTo=${model[0].dateTo}&propId=${model[0].propId}`;
            return srv.getComplaint(url);

        default:
            break;
    }
}


    manageAssetTracking(model, type) {
        let url = '';
        switch (type) {
            case 'R':
                url = `AssetTracking?assetId=${model[0].AssetId}&dteFr=${model[0].DteFr}&dteTo=${model[0].DteTo}`;
                return srv.getComplaint(url);
                break;
            default:
        }
    }

    manageAttendanceData(model, type) {
        let url = '';
        switch (type) {
            case 'R':
                url = `GetAllEmployeeAttendanceSummary?date=${model[0].Date}`;
                return srv.getComplaint(url);
                break;
            case 'D':
                url = `DeleteEmployeeAttendanceSummary?id=${model[0].Id}`;
                return srv.CallDeleteNewService(url,model[0]);
                break;
            default:
        }
    }

    manageEmployee(model, type) {
        switch (type) {
        case 'R':
            let url = `Facility/FacilityMember`;
            return srv.CallPostService(url, model[0]);
            break;
        }
    }

    manageResidentEvents(model, type) {
        let url = '';
        switch (type) {
            case 'R':
                url = `EventTaskBooking`;
                return srv.getComplaint(url);
                break;
                case 'Approve':
                url = `ApproveEventTaskBooking?BookingId=${model[0].BookingId}`;
                return srv.CallPostNewService(url);
                break;
            default:
        }
    }

    manageTaskEvents(model, type) {
        // 
        let url = '';
        switch (type) {
            case 'R':
                url = `TaskDetailsEvent`;
                return srv.getComplaint(url);
                break;
            default:
        }
    }

    manageAssets(model, type) {
        // 
        let url = '';
        switch (type) {
            case 'R':
                url = `GetAssets?propertyId=${model.propertyId}`;
                return srv.getComplaint(url);
                break;
            default:
        }
    }

    manageAssign(model, type) {
        let url = '';
        switch (type) {
            case 'R':
                url = `AssignToList?propertyId=${model[0].PropertyId}`;
                return srv.getComplaint(url);
                break;
            default:
        }
    }

    manageDashboardAssign(model, type) {
        let url = '';
        switch (type) {
            case 'R':
                url = `DashboardAssignToList?propertyId=${model[0].PropertyId}`;
                return srv.getComplaint(url);
                break;
            default:
        }
    }

    manageTaskPriority(model, type) {
        let url = '';
        switch (type) {
            case 'R':
                url = `GetAllTaskPriorities`;
                return srv.getComplaint(url);
                break;
            default:
        }
    }

    manageProperties(model, type) {
        // 
        let url = '';
        switch (type) {
            case 'R':
                url = `GetAllProperties`;
                return srv.getComplaint(url);
                break;
            default:
        }
    }

    manageQues(model, type) {
        // 
        let url = '';
        switch (type) {
            case 'C':
                url = `/CreateQuestionnaire`;
                return srv.CallPostNewService(url, model[0]);
                break;
            case 'U':
                url = `/UpdateQuestionnaire`;
                return srv.CallPostNewService(url, model[0]);
                break;
            case 'D':
                url = `DeleteQuestionnaire?questID=${model[0].Id}`;
                return srv.CallDeleteNewService(url,model[0]);
                break;
            case 'R':
                url=`QuestionsDetailsOfTask?taskID=${model[0].Id}&TransactionDate=${model[0].date}`;
                return srv.getComplaint(url);
                break;
            case 'AB': //Amenites Bookings
                url=`AmenitiesBookings?PropertyID=${model[0].PropertyId}&UserID=${model[0].UserId}&DateFr=${model[0].DateFrom}&DateTo=${model[0].DateTo}`;
                return srv.getComplaint(url);
                break;
            case 'ABA': //Amenites Bookings Approve
                url=`AmenitiesBookingApprove?Id=${model[0].Id}`;
                return srv.getComplaint(url);
                break;
            default:
        }
    }

    manageRemarks(model, type) {
        // 
        let url = '';
        switch (type) {
            case 'C':
                url = `CreateTaskWiseFmStatusData`;
                return srv.CallPostNewService(url, model[0]);
                break;
            default:
        }
    }

    manageQuesImage(model, type) {
        // 
        let url = '';
        switch (type) {
            case 'R':
                url = `GetTaskQuestionImage?TaskId=${model[0].TaskId}&QuestId=${model[0].QuestId}&UpdatedOn=${model[0].UpdatedOn}`;
                return srv.getComplaint(url, model[0]);
                break;
            default:
        }
    }

    manageAssigne(PropertyId) {
        let url = `Calendar/Assignee/${PropertyId}`;
        return srv.get(url);
    }

    manageEvents(model, type) {
        let url = '';
        switch (type) {
            case 'C':
                url = `Calendar/Event/Save`;
                return srv.CallPostService(url, model[0]);
                break;
            case 'U':
                url = `Calendar/Event/Save`;
                return srv.CallPostService(url, model[0]);
                break;
            case 'D':
                url = `Calendar/Event/Approval/Save`;
                //  url = `Calendar/Event/Delete/${model[0].id}/${model[0].cmdType}`;
                return srv.CallPostService(url, model[0]);
                break;
            case 'E': // event list
                url = `Calendar/Event/List/${model[0].CmdType}/${model[0].PropertyId}/${model[0].EventType}/${model[0].Categories}/${model[0].Assignees}/${model[0].EventStatus}`;
                return srv.get(url);
                break;
            case 'DT': // event details
                url = `Calendar/Event/Details/${model[0].CmdType}/${model[0].PropertyId}/${model[0].EventId}/${model[0].SubEventId}`;
                return srv.get(url);
                break;
            case 'EATT': // event attachment
                url = `Calendar/Event/Attachment/${model[0].cmdType}/${model[0].id}`;
                return srv.get(url);
                break;
            case 'EST': // event SubTask
                url = `Calendar/Event/SubTask/${model[0].cmdType}/${model[0].SubEventId}`;
                return srv.get(url);
                break;
            case 'UST':
                url = `Calendar/Event/Subtask/Complete/${model[0].id}/${model[0].cmdType}/${model[0].isCompleted}`;
                return srv.CallPostService(url);
                break;
            case 'DST':
                url = `Calendar/Event/Subtask/Delete/${model[0].id}/${model[0].cmdType}`;
                return srv.CallPostService(url);
                break;
            case 'ELog': // event logs
                url = `Calendar/Event/Logs/${model[0].cmdType}/${model[0].EventId}/${model[0].SubEventId}`;
                return srv.get(url);
                break;
            case 'EComments': // get event comments 
                url = `Calendar/Event/Comments/${model[0].cmdType}/${model[0].SubEventId}/${model[0].EventId}`;
                return srv.get(url);
                break;
            case 'CComment':
                url = `Calendar/Event/Comment/Save`;
                return srv.CallPostService(url, model[0]);
                break;
            case 'CEVT': // mark as complete event 
                url = `Calendar/Event/Complete`;
                return srv.CallPostService(url, model[0]);
                break;
            default:
        }
    }

    manageGuardData() {
        let url = `GuardList`;
        return srv.getComplaint(url);
    }

    manageGuardSpotVisitDetails(modal, type) {
        let url = `SpotVisitDetails?guardId=${modal[0].GuardId}&visitdate=${modal[0].VisitDate}`;
        return srv.getComplaint(url);
    }

    getTaskStatus() {
        let url = `Calendar/Event/TaskStatus`;
        return srv.get(url);
    }

    manageEventApproval(model, type) {
        let url = '';
        switch (type) {
            case 'R': // get event approval list 
                url = `Calendar/Event/Approval/List/${model[0].cmdType}/${model[0].PropertyId}/${model[0].FilterType}/${model[0].PageSize}/${model[0].PageNumber}/${model[0].SearchValue}`;
                return srv.get(url);
                break;
            case 'U': // update approval state and made changes according event and sub event table
                url = `Calendar/Event/Approval/Response/Save`;
                return srv.CallPostService(url, model[0]);
                break;
            default:
        }
    }

    manageKYC(model, type) {
        // 
        let url = '';
        switch (type) {
            case 'U':
                url = `Calendar/Category/Save`;
                return srv.CallPostService(url, model[0]);
                break;
            case 'D':
                url = `Calendar/Category/Delete/${model[0].CatId}/${model[0].CmdType}`;
                return srv.CallPostService(url);
                break;
            case 'R':
                url = `KycDetailsList/${model[0].CmdType}`;
                return srv.get(url);
                break;
            default:
        }
    }

}
export default DataProvider;

import React, { useEffect, useState } from "react";
import Form from "react-bootstrap/Form";
import Button from "react-bootstrap/Button";

const IMAGE_SCALE = 0.5;
const IMAGE_QUALITY = 0.35;

const CheckOut = ({sendData, close, initialType = "asset", hideTypeSwitch = false} ) => {
  const [checkoutType, setCheckoutType] = useState(initialType);
  const [formData, setFormData] = useState({
    assigneeName: "",
    purpose: "",
    checkOutDateTime: "",
    outFrom: "",
    
    sentTo: "",
    tentativeReturnDate: "",
    imageOut: null,
    spareFields: [{ id: 1, spareName: "",tentativeReturnDate:"" }],
    approvedBy:"",
    // Description:"",
    // assetImage:"",
    // flag:"I"
  });

  useEffect(() => {
    setCheckoutType(initialType);
  }, [initialType]);

  const handleSelectionChange = (event) => {
    setCheckoutType(event.target.value);
  };

  const handleInputChange = (index, event) => {
    const { name, value } = event.target;
    if (index !== null) {
      const updatedSpareFields = [...formData.spareFields];
      updatedSpareFields[index][name] = value;
      setFormData({ ...formData, spareFields: updatedSpareFields });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleAddSpareField = () => {
    const newId = formData.spareFields.length + 1;
    setFormData({
      ...formData,
      spareFields: [...formData.spareFields, { id: newId, spareName: "", returnDateTime: "" }],
    });
  };

  const handleRemoveSpareField = (index) => {
    const updatedSpareFields = formData.spareFields.filter(
      (field, idx) => idx !== index
    );
    setFormData({ ...formData, spareFields: updatedSpareFields });
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
  
    reader.onloadend = () => {
      const image = new Image();
      image.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.floor(image.width * IMAGE_SCALE));
        canvas.height = Math.max(1, Math.floor(image.height * IMAGE_SCALE));

        const context = canvas.getContext("2d");
        context.drawImage(image, 0, 0, canvas.width, canvas.height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", IMAGE_QUALITY);
        const base64String = compressedDataUrl.split(",")[1];
        setFormData({ ...formData, imageOut: base64String });
      };

      image.src = reader.result;
    };
  
    reader.readAsDataURL(file);
  };

const handleSubmit = (event) => {
  event.preventDefault();

  const payload = {
    AssigneeName: formData.assigneeName,
    Purpose: formData.purpose,
    CheckOutDateTime: formData.checkOutDateTime
      ? new Date(formData.checkOutDateTime).toISOString()
      : null,
    OutFrom: formData.outFrom,
    SentTo: formData.sentTo,
    TentativeReturnDate: formData.tentativeReturnDate
      ? new Date(formData.tentativeReturnDate).toISOString()
      : null,
    ImageOut: formData.imageOut || null,
    ApprovedBy: formData.approvedBy,
    SpareFields:
      checkoutType === "asset"
        ? []
        : formData.spareFields
            .filter(sf => sf.spareName.trim() !== "")
            .map(sf => ({
              Id: sf.id,
              SpareName: sf.spareName,
              TentativeReturnDate: sf.tentativeReturnDate
                ? new Date(sf.tentativeReturnDate).toISOString()
                : null,
              ReturnDateTime: null
            }))
  };

  sendData(payload);
  close();
};


  return (
    <div className="transfer-action-form">
      <Form onSubmit={handleSubmit}>
        {!hideTypeSwitch ? (
          <Form.Group>
            <Form.Check
              type="radio"
              id="check-asset"
              label="Check Out Asset"
              value="asset"
              checked={checkoutType === "asset"}
              onChange={handleSelectionChange}
            />
            <Form.Check
              type="radio"
              id="check-spare"
              label="Check Out Spare"
              value="spare"
              checked={checkoutType === "spare"}
              onChange={handleSelectionChange}
            />
          </Form.Group>
        ) : null}

        {checkoutType === "asset" && (
          <div>
            <Form.Group controlId="assigneeName">
              <Form.Label>Assignee Name</Form.Label>
              <Form.Control
                type="text"
                name="assigneeName"
                value={formData.assigneeName}
                onChange={(e) => handleInputChange(null, e)}
                required
              />
            </Form.Group>

            <Form.Group controlId="purpose">
              <Form.Label>Purpose Of Check Out</Form.Label>
              <Form.Control
                type="text"
                name="purpose"
                value={formData.purpose}
                onChange={(e) => handleInputChange(null, e)}
                required
              />
            </Form.Group>

            <Form.Group controlId="checkOutDateTime">
              <Form.Label>Check Out Date and Time</Form.Label>
              <Form.Control
                type="datetime-local"
                name="checkOutDateTime"
                value={formData.checkOutDateTime}
                onChange={(e) => handleInputChange(null, e)}
                required
              />
            </Form.Group>

            <Form.Group controlId="outFrom">
              <Form.Label>Out From</Form.Label>
              <Form.Control
                type="text"
                name="outFrom"
                value={formData.outFrom}
                onChange={(e) => handleInputChange(null, e)}
              />
            </Form.Group>

            <Form.Group controlId="sentTo">
              <Form.Label>Sent To</Form.Label>
              <Form.Control
                type="text"
                name="sentTo"
                value={formData.sentTo}
                onChange={(e) => handleInputChange(null, e)}
              />
            </Form.Group>

            <Form.Group controlId="tentativeReturnDate">
              <Form.Label>Tentative Date of Returning</Form.Label>
              <Form.Control
                type="date"
                name="tentativeReturnDate"
                value={formData.tentativeReturnDate}
                onChange={(e) => handleInputChange(null, e)}
                
              />
            </Form.Group>

            <Form.Group controlId="imageOut">
              <Form.Label>Upload Image</Form.Label>
              <Form.Control
                type="file"
                name="imageOut"
                onChange={handleImageChange}
                // onChange={(e) =>
                //   setFormData({ ...formData, imageOut: e.target.files[0] })
                // }
                accept="image/*"
                
              />
            </Form.Group>
            <Form.Group controlId="approvedBy">
              <Form.Label>Approved By</Form.Label>
              <Form.Control
                type="text"
                name="approvedBy"
                value={formData.approvedBy}
                onChange={(e) => handleInputChange(null, e)}
                required
              />
            </Form.Group>
          </div>
        )}

{checkoutType === "spare" && (
  <div>
    {formData.spareFields.map((field, index) => (
      <div key={field.id}>
        <Form.Group>
          <Form.Label>Spare Name {index + 1}</Form.Label>
          <Form.Control
            type="text"
            name="spareName"
            value={field.spareName}
            onChange={(e) => handleInputChange(index, e)}
            required
          />
          {index > 0 && (
            <Button
              variant="danger"
              onClick={() => handleRemoveSpareField(index)}
              className="my-2"
            >
              Remove Spare
            </Button>
          )}
        </Form.Group>

        <Form.Group>
          <Form.Label>Tentative Date of Returning {index + 1}</Form.Label>
          <Form.Control
            type="date"
            name="tentativeReturnDate"
            value={field.tentativeReturnDate}
            onChange={(e) => handleInputChange(index, e)}
          />
        </Form.Group>
      </div>
    ))}

    <Button
      variant="primary"
      onClick={handleAddSpareField}
      className="mt-2"
    >
      Add Spare
    </Button>

    <Form.Group controlId="assigneeName">
      <Form.Label>Assignee Name</Form.Label>
      <Form.Control
        type="text"
        name="assigneeName"
        value={formData.assigneeName}
        onChange={(e) => handleInputChange(null, e)}
        required
      />
    </Form.Group>

    <Form.Group controlId="purpose">
      <Form.Label>Purpose Of Check Out</Form.Label>
      <Form.Control
        type="text"
        name="purpose"
        value={formData.purpose}
        onChange={(e) => handleInputChange(null, e)}
        required
      />
    </Form.Group>

    <Form.Group controlId="checkOutDateTime">
      <Form.Label>Check Out Date and Time</Form.Label>
      <Form.Control
        type="datetime-local"
        name="checkOutDateTime"
        value={formData.checkOutDateTime}
        onChange={(e) => handleInputChange(null, e)}
        required
      />
    </Form.Group>

    <Form.Group controlId="outFrom">
      <Form.Label>Out From</Form.Label>
      <Form.Control
        type="text"
        name="outFrom"
        value={formData.outFrom}
        onChange={(e) => handleInputChange(null, e)}
      />
    </Form.Group>

    <Form.Group controlId="sentTo">
      <Form.Label>Sent To</Form.Label>
      <Form.Control
        type="text"
        name="sentTo"
        value={formData.sentTo}
        onChange={(e) => handleInputChange(null, e)}
      />
    </Form.Group>

    <Form.Group controlId="imageOut">
      <Form.Label>Upload Image</Form.Label>
      <Form.Control
        type="file"
        name="imageOut"
        onChange={handleImageChange}
        // onChange={(e) =>
        //   setFormData({ ...formData, imageOut: e.target.files[0] })
        // }
        accept="image/*"
      />
    </Form.Group>
    <Form.Group controlId="approvedBy">
              <Form.Label>Approved By</Form.Label>
              <Form.Control
                type="text"
                name="approvedBy"
                value={formData.approvedBy}
                onChange={(e) => handleInputChange(null, e)}
                required
              />
            </Form.Group>
  </div>
)}
     <div className="form-footer mt-3 d-flex justify-content-between ">
      <Button variant="primary" type="submit" className="mt-3 px-3 ">
          Check Out
        </Button>
        <Button variant="secondary" className="mt-3 px-4" onClick={close}>
          Close
        </Button></div>
        
      </Form>
    </div>
  );
};
export default CheckOut;

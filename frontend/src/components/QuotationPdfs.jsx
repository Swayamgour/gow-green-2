import React from "react";
import "./PriceTable.css";

export default function QuotationPdfs({ quotation }) {

    // 👉 items ko map karo
    const data = quotation?.items?.map(item => ({
        code: item.description || "-",
        watt: item.watt || "-",
        length: item.length || "-",
        breadth: item.breadth || "-",
        height: item.height || "-",
        weight: item.weight || "-",
        surge: item.surge || "-",
        price: item.amount || 0,
    })) || [];

    return (
        <div className="price-container">

            {/* HEADER */}
            <div className="main-header">
                PRICE LIST OF GLOW GREEN LED PRODUCTS
            </div>

            {/* SUB HEADER */}
            <div className="sub-header">
                {quotation?.series || "DFL"} SERIES
            </div>

            {/* TABLE */}
            <table className="price-table">
                <thead>
                    <tr>
                        <th>Picture</th>
                        <th>Product Code</th>
                        <th>Series</th>
                        <th>Wattage</th>
                        <th>Length (mm)</th>
                        <th>Breadth (mm)</th>
                        <th>Height (mm)</th>
                        <th>Weight (Kg)</th>
                        <th>Surge</th>
                        <th>OEM PRICE</th>
                    </tr>
                </thead>

                <tbody>
                    {data.map((item, i) => (
                        <tr key={i}>

                            {/* image only once */}
                            {i === 0 && (
                                <td rowSpan={data.length} className="img-cell">
                                    <img
                                        src={quotation?.image || "https://via.placeholder.com/120"}
                                        alt="product"
                                    />
                                </td>
                            )}

                            <td>{item.code}</td>
                            <td>{quotation?.series || "-"}</td>
                            <td>{item.watt}</td>
                            <td>{item.length}</td>
                            <td>{item.breadth}</td>
                            <td>{item.height}</td>
                            <td>{item.weight}</td>
                            <td>{item.surge}</td>
                            <td className="price">₹ {item.price}</td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* TOTAL */}
            <div style={{ marginTop: 20, textAlign: "right", fontWeight: "bold" }}>
                Grand Total: ₹ {quotation?.grandTotal || 0}
            </div>

        </div>
    );
}
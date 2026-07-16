import { useState, useCallback, useMemo } from "react";
import { Tag, Listbox, Combobox } from "@shopify/polaris";

export interface ProductMultiSelectProps {
  index: number;
  buyProductId: string;
  selectedIds: string[];
  products: Array<{ id: string; title: string }>;
  onChange: (selectedIds: string[]) => void;
}

export function ProductMultiSelect({
  index,
  buyProductId,
  selectedIds,
  products,
  onChange,
}: ProductMultiSelectProps) {
  const [inputValue, setInputValue] = useState("");

  const filteredProducts = useMemo(() => {
    const query = inputValue.toLowerCase().trim();
    return products.filter((p) => {
      const isNotBuyProduct = p.id !== buyProductId;
      const matchesQuery = p.title.toLowerCase().includes(query);
      return isNotBuyProduct && matchesQuery;
    });
  }, [products, buyProductId, inputValue]);

  const updateSelection = useCallback(
    (value: string) => {
      if (selectedIds.includes(value)) {
        onChange(selectedIds.filter((item) => item !== value));
      } else {
        if (selectedIds.length < 3) {
          onChange([...selectedIds, value]);
        }
      }
    },
    [selectedIds, onChange],
  );

  const removeTag = useCallback(
    (tag: string) => () => {
      onChange(selectedIds.filter((item) => item !== tag));
    },
    [selectedIds, onChange],
  );

  const tagsMarkup = selectedIds.map((id) => {
    const matchedProduct = products.find((p) => p.id === id);
    return (
      <Tag key={id} onRemove={removeTag(id)}>
        {matchedProduct ? matchedProduct.title : "Selected Product"}
      </Tag>
    );
  });

  const optionsMarkup = filteredProducts.map((option) => (
    <Listbox.Option
      key={option.id}
      value={option.id}
      selected={selectedIds.includes(option.id)}
    >
      {option.title}
    </Listbox.Option>
  ));

  return (
    <div style={{ width: "100%" }}>
      {/* Hidden inputs to support standard form submission */}
      {selectedIds.map((id) => (
        <input
          key={id}
          type="hidden"
          name={`restrictedProductIds_${index}`}
          value={id}
        />
      ))}

      <Combobox
        allowMultiple
        activator={
          <Combobox.TextField
            onChange={setInputValue}
            label="Select Mapped Restrictions (Max 3):"
            value={inputValue}
            placeholder="Search products to restrict..."
            verticalContent={
              selectedIds.length > 0 ? (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "4px",
                    padding: "4px",
                  }}
                >
                  {tagsMarkup}
                </div>
              ) : undefined
            }
            autoComplete="off"
          />
        }
      >
        {filteredProducts.length > 0 ? (
          <Listbox onSelect={updateSelection}>{optionsMarkup}</Listbox>
        ) : null}
      </Combobox>
    </div>
  );
}
